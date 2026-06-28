import { NextResponse } from "next/server"
import { z } from "zod"
import { persistBankTransferSettings } from "@/lib/bankTransferSettings"
import { getBankTransferSettings } from "@/lib/bankTransferSettings"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { AdminActivityAction, logAdminActivity } from "@/lib/adminActivityLog"

const putSchema = z.object({
  accountHolder: z.string().trim().min(2).max(200),
  bankName: z.string().trim().max(120),
  iban: z
    .string()
    .trim()
    .min(15)
    .max(34)
    .regex(/^TR[0-9A-Z]+$/i, "Geçerli bir TR IBAN giriniz."),
  transferNote: z.string().trim().max(500),
})

export async function GET() {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }
    const s = await getBankTransferSettings(prisma)
    return NextResponse.json(s)
  } catch (error) {
    console.error("GET /api/admin/bank-transfer:", error)
    return NextResponse.json({ message: "Ayarlar yüklenemedi." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const parsed = putSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Geçersiz veri." },
        { status: 400 }
      )
    }

    await persistBankTransferSettings(prisma, parsed.data)
    const s = await getBankTransferSettings(prisma)

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.BANK_TRANSFER_SAVE,
      resourceType: "Settings",
      metadata: { area: "bank-transfer" },
      request,
    })

    return NextResponse.json({ ok: true, ...s })
  } catch (error) {
    console.error("PUT /api/admin/bank-transfer:", error)
    return NextResponse.json({ message: "Kaydedilemedi." }, { status: 500 })
  }
}
