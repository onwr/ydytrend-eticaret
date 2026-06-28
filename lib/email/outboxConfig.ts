import { getEnv } from "@/lib/env"

export function getEmailOutboxBatchSize(): number {
  const raw = process.env.EMAIL_OUTBOX_BATCH_SIZE
  const n = raw ? Number(raw) : 25
  return Number.isFinite(n) && n > 0 && n <= 200 ? Math.floor(n) : 25
}

export function getEmailOutboxMaxAttempts(): number {
  const raw = process.env.EMAIL_OUTBOX_MAX_ATTEMPTS
  const n = raw ? Number(raw) : 5
  return Number.isFinite(n) && n >= 1 && n <= 20 ? Math.floor(n) : 5
}

export function getEmailOutboxRetryMinutes(): number {
  const raw = process.env.EMAIL_OUTBOX_RETRY_MINUTES
  const n = raw ? Number(raw) : 5
  return Number.isFinite(n) && n >= 1 && n <= 1440 ? Math.floor(n) : 5
}

export function getUploadCleanupDryRun(): boolean {
  const env = getEnv()
  const raw = process.env.UPLOAD_CLEANUP_DRY_RUN
  if (raw === "false" || raw === "0") return false
  if (raw === "true" || raw === "1") return true
  return env.isProduction
}

export function getUploadCleanupMinAgeHours(): number {
  const raw = process.env.UPLOAD_CLEANUP_MIN_AGE_HOURS
  const n = raw ? Number(raw) : 24
  return Number.isFinite(n) && n >= 1 && n <= 8760 ? Math.floor(n) : 24
}

export const UPLOAD_CLEANUP_BATCH_LIMIT = 100
