import { logger } from "@/lib/logger"
import { sanitizeMonitoringContext, sanitizeMonitoringUser } from "@/lib/monitoring/sanitize"

type MonitoringUser = { id?: string | number; email?: string; username?: string }
type MonitoringLevel = "info" | "warning" | "error"

const tags = new Map<string, string>()
const contexts = new Map<string, Record<string, unknown>>()
let currentUser: ReturnType<typeof sanitizeMonitoringUser> | null = null

function logFallback(level: MonitoringLevel, message: string, extra?: Record<string, unknown>) {
  const fields = {
    ...sanitizeMonitoringContext(extra),
    ...(tags.size ? { tags: Object.fromEntries(tags) } : {}),
    ...(currentUser ? { userId: currentUser.id } : {}),
  }
  if (level === "error") logger.error(message, fields as Record<string, unknown>)
  else if (level === "warning") logger.warn(message, fields as Record<string, unknown>)
  else logger.info(message, fields as Record<string, unknown>)
}

/** SENTRY_DSN tanımlıysa structured log + opsiyonel harici entegrasyon noktası. */
export async function captureException(
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const safe = sanitizeMonitoringContext(context)
  if (process.env.SENTRY_DSN?.trim()) {
    logFallback("error", "captureException", {
      ...safe,
      sentry: true,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }
  logFallback("error", "captureException", {
    ...safe,
    error: error instanceof Error ? error.message : String(error),
  })
}

export async function captureMessage(
  message: string,
  level: MonitoringLevel = "info",
  context?: Record<string, unknown>
): Promise<void> {
  logFallback(level, message, { ...sanitizeMonitoringContext(context), sentry: Boolean(process.env.SENTRY_DSN) })
}

export async function setUser(user: MonitoringUser | null): Promise<void> {
  currentUser = user ? sanitizeMonitoringUser(user) : null
}

export async function setTag(key: string, value: string): Promise<void> {
  tags.set(key, value)
}

export async function setContext(name: string, context: Record<string, unknown>): Promise<void> {
  const safe = sanitizeMonitoringContext(context)
  if (safe) contexts.set(name, safe)
}

export const monitoringClient = {
  captureException(error: unknown, context?: Record<string, unknown>) {
    void captureException(error, context)
  },
  captureMessage(message: string, level: MonitoringLevel = "info", context?: Record<string, unknown>) {
    void captureMessage(message, level, context)
  },
}
