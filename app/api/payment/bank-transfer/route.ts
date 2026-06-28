import { NextResponse } from "next/server"
import { formatIbanDisplay, getBankTransferSettings } from "@/lib/bankTransferSettings"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const settings = await getBankTransferSettings(prisma)
    return NextResponse.json({
      accountHolder: settings.accountHolder,
      bankName: settings.bankName,
      iban: settings.iban,
      ibanFormatted: settings.iban ? formatIbanDisplay(settings.iban) : "",
      transferNote: settings.transferNote,
      isConfigured: Boolean(settings.iban.trim()),
    })
  } catch (error) {
    console.error("GET /api/payment/bank-transfer:", error)
    return NextResponse.json({ message: "Banka bilgileri yüklenemedi." }, { status: 500 })
  }
}
