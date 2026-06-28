/** Hassas alan ve değer redaksiyonu — log/audit için. */

const SENSITIVE_KEY_RE =
  /password|passwd|secret|token|authorization|cookie|jwt|iban|smtp|database_url|reset|unsubscribe|receipt|cvv|card/i

const JWT_RE = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const IBAN_RE = /\bTR[0-9]{2}[0-9A-Z]{22}\b/gi
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

export function maskEmail(email: string): string {
  const trimmed = email.trim()
  const at = trimmed.indexOf("@")
  if (at <= 0) return "***"
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  const visible = local.slice(0, Math.min(1, local.length))
  return `${visible}***@${domain}`
}

export function maskIban(value: string): string {
  const compact = value.replace(/\s/g, "")
  if (compact.length <= 4) return "****"
  return `${"*".repeat(Math.min(compact.length - 4, 12))}${compact.slice(-4)}`
}

export function redactString(value: string, maxLen = 500): string {
  let s = value
  if (JWT_RE.test(s.trim())) return "[REDACTED_JWT]"
  s = s.replace(IBAN_RE, (m) => maskIban(m))
  s = s.replace(EMAIL_RE, (m) => maskEmail(m))
  if (/mysql:\/\/|mariadb:\/\//i.test(s)) return "[REDACTED_DATABASE_URL]"
  if (s.length > maxLen) return `${s.slice(0, maxLen)}…`
  return s
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[MAX_DEPTH]"
  if (value === null || value === undefined) return value
  if (typeof value === "boolean" || typeof value === "number") return value
  if (typeof value === "string") return redactString(value)
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redactValue(v, depth + 1))
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_RE.test(k)) {
        out[k] = "[REDACTED]"
        continue
      }
      if (k === "customerNote" || k === "note" || k === "shippingLine1" || k === "shippingLine2") {
        out[k] = typeof v === "string" ? redactString(v.slice(0, 80)) : "[REDACTED]"
        continue
      }
      out[k] = redactValue(v, depth + 1)
    }
    return out
  }
  return redactString(String(value))
}

export function redactLogFields(fields: Record<string, unknown>): Record<string, unknown> {
  return redactValue(fields) as Record<string, unknown>
}
