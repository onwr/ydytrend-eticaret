import type { PrismaClient } from "@/generated/prisma/client"
import { logger } from "@/lib/logger"
import { maskEmail } from "@/lib/logRedaction"
import { enqueueEmail, processOutboxEntry, type EmailPayload, type QueueEmailInput } from "@/lib/email/outbox"

export type { EmailPayload, QueueEmailInput }

/**
 * Transactional mail — outbox'a yazar, ardından best-effort anında gönderim dener.
 * SMTP hatası ana işlemi etkilemez; başarısız kayıt cron ile retry edilir.
 */
export async function dispatchTransactionalEmail(
  prisma: PrismaClient,
  input: QueueEmailInput
): Promise<void> {
  try {
    const { id, created } = await enqueueEmail(prisma, input)
    if (!created) return

    const outcome = await processOutboxEntry(prisma, id)
    if (outcome === "retry" || outcome === "failed") {
      logger.info("Email deferred to outbox retry", {
        id,
        type: input.type,
        recipient: maskEmail(input.to),
      })
    }
  } catch (e) {
    logger.error("dispatchTransactionalEmail failed", {
      type: input.type,
      recipient: maskEmail(input.to),
      message: e instanceof Error ? e.message : "unknown",
    })
  }
}
