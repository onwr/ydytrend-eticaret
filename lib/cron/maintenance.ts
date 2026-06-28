import type { PrismaClient } from "@/generated/prisma/client"
import { logger } from "@/lib/logger"
import { CRON_LAST_ERROR_KEY, CRON_LAST_RUN_KEY } from "@/lib/buildInfo"

const BATCH_LIMIT = 500

async function upsertSetting(prisma: PrismaClient, key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value, type: "string" },
    update: { value, type: "string" },
  })
}

export type MaintenanceResult = {
  passwordTokensDeleted: number
  guestCartsDeleted: number
}

/** Idempotent bakım görevleri — batch limit ile. */
export async function runMaintenanceJobs(prisma: PrismaClient): Promise<MaintenanceResult> {
  const now = new Date()
  const cartCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const expiredTokens = await prisma.passwordResetToken.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true },
    take: BATCH_LIMIT,
  })
  if (expiredTokens.length > 0) {
    await prisma.passwordResetToken.deleteMany({
      where: { id: { in: expiredTokens.map((t) => t.id) } },
    })
  }

  const staleGuestCarts = await prisma.cart.findMany({
    where: {
      userId: null,
      guestToken: { not: null },
      updatedAt: { lt: cartCutoff },
    },
    select: { id: true },
    take: BATCH_LIMIT,
  })
  if (staleGuestCarts.length > 0) {
    await prisma.cart.deleteMany({
      where: { id: { in: staleGuestCarts.map((c) => c.id) } },
    })
  }

  const result = {
    passwordTokensDeleted: expiredTokens.length,
    guestCartsDeleted: staleGuestCarts.length,
  }

  await upsertSetting(prisma, CRON_LAST_RUN_KEY, now.toISOString())
  await upsertSetting(prisma, CRON_LAST_ERROR_KEY, "")

  logger.info("Maintenance cron completed", result)
  return result
}

export async function recordCronError(prisma: PrismaClient, message: string) {
  await upsertSetting(prisma, CRON_LAST_ERROR_KEY, message.slice(0, 500))
}
