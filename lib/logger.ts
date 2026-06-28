import { getEnv } from "@/lib/env"
import { redactLogFields } from "@/lib/logRedaction"

export type LogLevel = "debug" | "info" | "warn" | "error"

export type LogFields = {
  requestId?: string
  route?: string
  method?: string
  statusCode?: number
  durationMs?: number
  userId?: number
  orderId?: number | string
  returnRequestId?: string
  [key: string]: unknown
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function configuredLevel(): LogLevel {
  const env = getEnv()
  const raw = env.LOG_LEVEL
  if (raw && raw in LEVEL_ORDER) return raw
  return env.isProduction ? "info" : "debug"
}

function shouldEmit(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[configuredLevel()]
}

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  if (!shouldEmit(level)) return

  const env = getEnv()
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: env.NODE_ENV,
    release: process.env.npm_package_version ?? "0.1.0",
    ...(fields ? redactLogFields(fields) : {}),
  }

  const line = JSON.stringify(payload)

  switch (level) {
    case "error":
      console.error(line)
      break
    case "warn":
      console.warn(line)
      break
    default:
      console.log(line)
  }
}

export const logger = {
  debug(message: string, fields?: LogFields) {
    emit("debug", message, fields)
  },
  info(message: string, fields?: LogFields) {
    emit("info", message, fields)
  },
  warn(message: string, fields?: LogFields) {
    emit("warn", message, fields)
  },
  error(message: string, fields?: LogFields) {
    emit("error", message, fields)
  },
}
