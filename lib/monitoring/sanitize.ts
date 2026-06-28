const PII_KEYS =
  /email|phone|address|cookie|authorization|token|password|iban|body|shipping|billing|guest|note/i

export function sanitizeMonitoringContext(
  ctx: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!ctx) return undefined
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(ctx)) {
    if (PII_KEYS.test(k)) {
      out[k] = "[REDACTED]"
      continue
    }
    if (typeof v === "string" && v.length > 200) {
      out[k] = `${v.slice(0, 120)}…`
      continue
    }
    out[k] = v
  }
  return out
}

export function sanitizeMonitoringUser(user: {
  id?: string | number
  email?: string
  username?: string
}): { id?: string } {
  if (user.id !== undefined) return { id: String(user.id) }
  return {}
}
