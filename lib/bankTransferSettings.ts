import type { PrismaClient } from "@/generated/prisma/client"
import { BRAND_NAME } from "@/lib/brand"

export const BANK_ACCOUNT_HOLDER_KEY = "BANK_ACCOUNT_HOLDER"
export const BANK_NAME_KEY = "BANK_NAME"
export const BANK_IBAN_KEY = "BANK_IBAN"
export const BANK_TRANSFER_NOTE_KEY = "BANK_TRANSFER_NOTE"

export const BANK_TRANSFER_SETTING_KEYS = [
  BANK_ACCOUNT_HOLDER_KEY,
  BANK_NAME_KEY,
  BANK_IBAN_KEY,
  BANK_TRANSFER_NOTE_KEY,
] as const

export const DEFAULT_BANK_TRANSFER = {
  accountHolder: BRAND_NAME,
  bankName: "",
  iban: "",
  transferNote: "Havale/EFT açıklama alanına sipariş numaranızı yazınız.",
}

export type BankTransferSettings = {
  accountHolder: string
  bankName: string
  iban: string
  transferNote: string
}

export function formatIbanDisplay(iban: string): string {
  const clean = iban.replace(/\s/g, "").toUpperCase()
  return clean.replace(/(.{4})/g, "$1 ").trim()
}

export async function getBankTransferSettings(prisma: PrismaClient): Promise<BankTransferSettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...BANK_TRANSFER_SETTING_KEYS] } },
    select: { key: true, value: true },
  })
  const map = new Map(rows.map((r) => [r.key, r.value.trim()]))

  return {
    accountHolder: map.get(BANK_ACCOUNT_HOLDER_KEY) || DEFAULT_BANK_TRANSFER.accountHolder,
    bankName: map.get(BANK_NAME_KEY) || DEFAULT_BANK_TRANSFER.bankName,
    iban: map.get(BANK_IBAN_KEY) || DEFAULT_BANK_TRANSFER.iban,
    transferNote: map.get(BANK_TRANSFER_NOTE_KEY) || DEFAULT_BANK_TRANSFER.transferNote,
  }
}

export async function persistBankTransferSettings(
  prisma: PrismaClient,
  data: BankTransferSettings
): Promise<void> {
  const entries: Array<{ key: string; value: string }> = [
    { key: BANK_ACCOUNT_HOLDER_KEY, value: data.accountHolder.trim() },
    { key: BANK_NAME_KEY, value: data.bankName.trim() },
    { key: BANK_IBAN_KEY, value: data.iban.replace(/\s/g, "").toUpperCase() },
    { key: BANK_TRANSFER_NOTE_KEY, value: data.transferNote.trim() },
  ]

  await prisma.$transaction(
    entries.map(({ key, value }) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value, type: "string" },
        update: { value, type: "string" },
      })
    )
  )
}
