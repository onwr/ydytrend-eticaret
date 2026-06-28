import type { PrismaClient } from "@/generated/prisma/client"
import { EmailOutboxStatus } from "@/generated/prisma/client"
import { logger } from "@/lib/logger"
import { maskEmail, redactLogFields } from "@/lib/logRedaction"
import {
  getEmailOutboxBatchSize,
  getEmailOutboxMaxAttempts,
  getEmailOutboxRetryMinutes,
} from "@/lib/email/outboxConfig"
import { getMailOutboundEnabled, sendMailWithConfig, getSmtpConfig } from "@/lib/smtpSettings"
import { EMAIL_LAST_ERROR_KEY } from "@/lib/buildInfo"

export type EmailPayload = {
  subject: string
  text?: string
  html?: string
}

export type QueueEmailInput = {
  type: string
  to: string
  payload: EmailPayload
  idempotencyKey?: string
}

const LOCK_STALE_MS = 10 * 60 * 1000

export function computeNextAttemptAt(attempts: number): Date {
  const baseMinutes = getEmailOutboxRetryMinutes()
  const exponent = Math.min(Math.max(attempts, 1), 8)
  const delayMinutes = baseMinutes * Math.pow(2, exponent - 1)
  return new Date(Date.now() + delayMinutes * 60 * 1000)
}

function computeNextAttempt(attempts: number): Date {
  return computeNextAttemptAt(attempts)
}

async function upsertSetting(prisma: PrismaClient, key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value, type: "string" },
    update: { value, type: "string" },
  })
}

/** Outbox kaydı oluştur — idempotencyKey ile duplicate engellenir. */
export async function enqueueEmail(
  prisma: PrismaClient,
  input: QueueEmailInput
): Promise<{ id: string; created: boolean }> {
  const recipient = input.to.trim()
  if (!recipient) {
    throw new Error("Alıcı e-posta zorunlu.")
  }

  const maxAttempts = getEmailOutboxMaxAttempts()
  const payloadJson = JSON.stringify(input.payload)

  if (input.idempotencyKey) {
    const existing = await prisma.emailOutbox.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true },
    })
    if (existing) {
      return { id: existing.id, created: false }
    }
  }

  try {
    const row = await prisma.emailOutbox.create({
      data: {
        type: input.type.slice(0, 80),
        recipient,
        payloadJson,
        maxAttempts,
        idempotencyKey: input.idempotencyKey ?? null,
        status: EmailOutboxStatus.PENDING,
        nextAttemptAt: new Date(),
      },
      select: { id: true },
    })
    logger.info("Email queued", {
      type: input.type,
      recipient: maskEmail(recipient),
      id: row.id,
    })
    return { id: row.id, created: true }
  } catch (e) {
    if (input.idempotencyKey && e instanceof Error && /Unique constraint/i.test(e.message)) {
      const existing = await prisma.emailOutbox.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true },
      })
      if (existing) return { id: existing.id, created: false }
    }
    throw e
  }
}

async function sendOutboxRow(
  prisma: PrismaClient,
  row: { id: string; recipient: string; payloadJson: string; attempts: number; maxAttempts: number }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const enabled = await getMailOutboundEnabled(prisma)
  if (!enabled) {
    return { ok: false, error: "SMTP gönderimi kapalı." }
  }

  let payload: EmailPayload
  try {
    payload = JSON.parse(row.payloadJson) as EmailPayload
  } catch {
    return { ok: false, error: "Geçersiz payload JSON." }
  }

  try {
    const config = await getSmtpConfig(prisma)
    await sendMailWithConfig(config, {
      to: row.recipient,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SMTP gönderim hatası"
    return { ok: false, error: msg.slice(0, 500) }
  }
}

/** Tek outbox kaydını işle — cron veya immediate dispatch için. */
export async function processOutboxEntry(
  prisma: PrismaClient,
  id: string
): Promise<"sent" | "retry" | "failed" | "skipped"> {
  const now = new Date()
  const row = await prisma.emailOutbox.findUnique({ where: { id } })
  if (!row) return "skipped"
  if (row.status === EmailOutboxStatus.SENT || row.status === EmailOutboxStatus.FAILED) {
    return "skipped"
  }
  if (row.status === EmailOutboxStatus.PROCESSING && row.lockedAt) {
    const age = now.getTime() - row.lockedAt.getTime()
    if (age < LOCK_STALE_MS) return "skipped"
  }
  if (row.nextAttemptAt > now && row.status === EmailOutboxStatus.PENDING) {
    return "skipped"
  }

  const locked = await prisma.emailOutbox.updateMany({
    where: {
      id,
      status: { in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.PROCESSING] },
    },
    data: {
      status: EmailOutboxStatus.PROCESSING,
      lockedAt: now,
    },
  })
  if (locked.count === 0) return "skipped"

  const result = await sendOutboxRow(prisma, row)

  if (result.ok) {
    await prisma.emailOutbox.update({
      where: { id },
      data: {
        status: EmailOutboxStatus.SENT,
        sentAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
    })
    logger.info("Email sent", { id, recipient: maskEmail(row.recipient) })
    return "sent"
  }

  const nextAttempts = row.attempts + 1
  const failed = nextAttempts >= row.maxAttempts
  await prisma.emailOutbox.update({
    where: { id },
    data: {
      status: failed ? EmailOutboxStatus.FAILED : EmailOutboxStatus.PENDING,
      attempts: nextAttempts,
      lastError: result.error,
      lockedAt: null,
      nextAttemptAt: failed ? row.nextAttemptAt : computeNextAttempt(nextAttempts),
    },
  })

  await upsertSetting(prisma, EMAIL_LAST_ERROR_KEY, result.error)

  logger.warn("Email send failed", redactLogFields({
    id,
    recipient: maskEmail(row.recipient),
    attempts: nextAttempts,
    error: result.error,
    failed,
  }))

  return failed ? "failed" : "retry"
}

export type OutboxBatchResult = {
  processed: number
  sent: number
  retry: number
  failed: number
  skipped: number
}

/** Bekleyen outbox kayıtlarını batch işle. */
export async function processOutboxBatch(prisma: PrismaClient): Promise<OutboxBatchResult> {
  const batchSize = getEmailOutboxBatchSize()
  const now = new Date()
  const staleLock = new Date(now.getTime() - LOCK_STALE_MS)

  await prisma.emailOutbox.updateMany({
    where: {
      status: EmailOutboxStatus.PROCESSING,
      lockedAt: { lt: staleLock },
    },
    data: { status: EmailOutboxStatus.PENDING, lockedAt: null },
  })

  const pending = await prisma.emailOutbox.findMany({
    where: {
      status: EmailOutboxStatus.PENDING,
      nextAttemptAt: { lte: now },
    },
    orderBy: { nextAttemptAt: "asc" },
    take: batchSize,
    select: { id: true },
  })

  const result: OutboxBatchResult = {
    processed: pending.length,
    sent: 0,
    retry: 0,
    failed: 0,
    skipped: 0,
  }

  for (const row of pending) {
    const status = await processOutboxEntry(prisma, row.id)
    if (status === "sent") result.sent++
    else if (status === "retry") result.retry++
    else if (status === "failed") result.failed++
    else result.skipped++
  }

  logger.info("Email outbox batch completed", result)
  return result
}
