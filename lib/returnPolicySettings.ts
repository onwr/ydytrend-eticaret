import type { PrismaClient } from "@/generated/prisma/client"

export const RETURN_WINDOW_DAYS_KEY = "RETURN_WINDOW_DAYS"
export const EXCHANGE_WINDOW_DAYS_KEY = "EXCHANGE_WINDOW_DAYS"
export const CANCEL_IN_PROCESSING_KEY = "CANCEL_IN_PROCESSING_DIRECT"

export const RETURN_POLICY_KEYS = [
  RETURN_WINDOW_DAYS_KEY,
  EXCHANGE_WINDOW_DAYS_KEY,
  CANCEL_IN_PROCESSING_KEY,
] as const

export type ReturnPolicySettings = {
  returnWindowDays: number
  exchangeWindowDays: number
  cancelInProcessingDirect: boolean
}

const DEFAULTS: ReturnPolicySettings = {
  returnWindowDays: 14,
  exchangeWindowDays: 14,
  cancelInProcessingDirect: true,
}

export async function getReturnPolicySettings(
  prisma: PrismaClient
): Promise<ReturnPolicySettings> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...RETURN_POLICY_KEYS] } },
    select: { key: true, value: true },
  })
  const map = new Map(rows.map((r) => [r.key, r.value.trim()]))

  const returnDays = parseInt(map.get(RETURN_WINDOW_DAYS_KEY) ?? "", 10)
  const exchangeDays = parseInt(map.get(EXCHANGE_WINDOW_DAYS_KEY) ?? "", 10)

  return {
    returnWindowDays:
      Number.isFinite(returnDays) && returnDays > 0 ? returnDays : DEFAULTS.returnWindowDays,
    exchangeWindowDays:
      Number.isFinite(exchangeDays) && exchangeDays > 0 ? exchangeDays : DEFAULTS.exchangeWindowDays,
    cancelInProcessingDirect: map.get(CANCEL_IN_PROCESSING_KEY) !== "false",
  }
}

export async function persistReturnPolicySettings(
  prisma: PrismaClient,
  data: ReturnPolicySettings
): Promise<void> {
  const entries = [
    { key: RETURN_WINDOW_DAYS_KEY, value: String(Math.max(1, data.returnWindowDays)) },
    { key: EXCHANGE_WINDOW_DAYS_KEY, value: String(Math.max(1, data.exchangeWindowDays)) },
    { key: CANCEL_IN_PROCESSING_KEY, value: data.cancelInProcessingDirect ? "true" : "false" },
  ]
  await prisma.$transaction(
    entries.map(({ key, value }) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value, type: "string" },
        update: { value },
      })
    )
  )
}

export function isWithinReturnWindow(
  deliveredAt: Date | null | undefined,
  windowDays: number,
  now = new Date()
): boolean {
  if (!deliveredAt) return false
  const end = new Date(deliveredAt)
  end.setDate(end.getDate() + windowDays)
  return now <= end
}
