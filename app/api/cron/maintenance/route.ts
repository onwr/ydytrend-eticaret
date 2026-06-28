import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEnv } from "@/lib/env"
import { logger } from "@/lib/logger"
import { recordCronError, runMaintenanceJobs } from "@/lib/cron/maintenance"
import { jsonForbidden } from "@/lib/apiError"

export const dynamic = "force-dynamic"
export const maxDuration = 60

let lock = false

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
    return NextResponse.json({ message: "Cron zaten çalışıyor." }, { status: 409 })
  }

  lock = true
  try {
    const result = await runMaintenanceJobs(prisma)
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cron hatası"
    logger.error("Cron maintenance failed", { message: msg })
    await recordCronError(prisma, msg)
    return NextResponse.json({ ok: false, message: "Bakım görevi başarısız." }, { status: 500 })
  } finally {
    lock = false
  }
}
