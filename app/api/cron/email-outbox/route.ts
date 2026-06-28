import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEnv } from "@/lib/env"
import { logger } from "@/lib/logger"
import { processOutboxBatch } from "@/lib/email/outbox"
import { jsonForbidden } from "@/lib/apiError"
import { EMAIL_LAST_ERROR_KEY } from "@/lib/buildInfo"

export const dynamic = "force-dynamic"
export const maxDuration = 60

let lock = false

async function upsertSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value, type: "string" },
    update: { value, type: "string" },
  })
}

export async function POST(request: Request) {
  const env = getEnv()
  const secret = env.CRON_SECRET
  if (!secret) {
    return jsonForbidden("Cron yapılandırılmamış.")
  }

  const auth = request.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  const headerSecret = request.headers.get("x-cron-secret")
  if (bearer !== secret && headerSecret !== secret) {
    return jsonForbidden("Geçersiz cron secret.")
  }

  if (lock) {
    return NextResponse.json({ message: "Email outbox cron zaten çalışıyor." }, { status: 409 })
  }

  lock = true
  try {
    const result = await processOutboxBatch(prisma)
    await upsertSetting("EMAIL_OUTBOX_LAST_RUN", new Date().toISOString())
    if (result.sent > 0) {
      await upsertSetting(EMAIL_LAST_ERROR_KEY, "")
    }
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Email outbox cron hatası"
    logger.error("Email outbox cron failed", { message: msg })
    await upsertSetting(EMAIL_LAST_ERROR_KEY, msg.slice(0, 500))
    return NextResponse.json({ ok: false, message: "Email outbox işlemi başarısız." }, { status: 500 })
  } finally {
    lock = false
  }
}
