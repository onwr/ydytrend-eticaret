import { NextResponse } from "next/server"
import { z } from "zod"
import { NewsletterStatus } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getClientIp, rateLimitNewsletterSubscribe } from "@/lib/newsletterRateLimit"

const bodySchema = z.object({
  email: z.string().trim().email().max(255),
  consent: z.boolean().refine((v) => v === true, { message: "Abonelik için onay gerekli." }),
  website: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await rateLimitNewsletterSubscribe(ip)
    if (!rl.allowed) {
      const { jsonRateLimited } = await import("@/lib/apiError")
      return jsonRateLimited(rl.retryAfterSeconds ?? 60)
    }

    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      const msg = parsed.error.flatten().formErrors[0] ?? "Geçersiz istek."
      return NextResponse.json({ message: msg }, { status: 400 })
    }

    if (parsed.data.website?.trim()) {
      return NextResponse.json({ message: "Abonelik kaydedildi." })
    }

    const email = parsed.data.email.toLowerCase()
    const now = new Date()

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (existing?.status === NewsletterStatus.ACTIVE) {
      return NextResponse.json({ message: "Bu e-posta zaten bültenimize kayıtlı." })
    }

    if (existing) {
      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: NewsletterStatus.ACTIVE,
          consentAt: now,
          confirmedAt: now,
          unsubscribedAt: null,
          source: "homepage",
        },
      })
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
          status: NewsletterStatus.ACTIVE,
          source: "homepage",
          consentAt: now,
          confirmedAt: now,
        },
      })
    }

    return NextResponse.json({ message: "Bültenimize kaydoldunuz. Teşekkürler!" })
  } catch (error) {
    console.error("Newsletter subscribe error:", error)
    return NextResponse.json({ message: "Kayıt tamamlanamadı." }, { status: 500 })
  }
}
