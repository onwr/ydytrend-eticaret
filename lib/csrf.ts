import { getEnv } from "@/lib/env"

const CSRF_EXEMPT_PREFIXES = [
  "/api/payment/callback",
  "/api/payment/bank-transfer",
] as const

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1"])

function isLocalDevOrigin(origin: string): boolean {
  try {
    const u = new URL(origin)
    return LOCAL_DEV_HOSTS.has(u.hostname)
  } catch {
    return false
  }
}

function originAllowed(origin: string, allowedOrigin: string, allowLocalDev: boolean): boolean {
  if (origin === allowedOrigin) return true
  return allowLocalDev && isLocalDevOrigin(origin)
}

export function isCsrfExemptPath(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
}

export function requiresCsrfCheck(method: string, pathname: string): boolean {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return false
  if (!pathname.startsWith("/api/")) return false
  if (isCsrfExemptPath(pathname)) return false
  return true
}

/**
 * Cookie-auth API isteklerinde origin doğrulama.
 * JSON API: Origin veya Referer site URL ile eşleşmeli.
 */
export function validateApiOrigin(request: Request): { ok: true } | { ok: false; reason: string } {
  const env = getEnv()
  const allowedOrigin = new URL(env.siteUrl).origin
  const allowLocalDev = env.isDevelopment || env.isTest

  const origin = request.headers.get("origin")?.trim()
  if (origin) {
    if (originAllowed(origin, allowedOrigin, allowLocalDev)) return { ok: true }
    return { ok: false, reason: "Origin eşleşmiyor." }
  }

  const referer = request.headers.get("referer")?.trim()
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin
      if (originAllowed(refOrigin, allowedOrigin, allowLocalDev)) return { ok: true }
    } catch {
      return { ok: false, reason: "Geçersiz Referer." }
    }
    return { ok: false, reason: "Referer eşleşmiyor." }
  }

  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    if (env.isDevelopment) return { ok: true }
    return { ok: false, reason: "Origin/Referer başlığı gerekli." }
  }

  return { ok: true }
}
