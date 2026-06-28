import { getEnv } from "@/lib/env"

/**
 * İstemci IP'si — yalnızca TRUST_PROXY=1 veya production'da X-Forwarded-For güvenilir.
 * Aksi halde doğrudan bağlantı IP'si bilinmediği için "unknown" döner.
 */
export function getClientIp(request: Request): string {
  const env = getEnv()
  const trustProxy = env.TRUST_PROXY || env.isProduction

  if (trustProxy) {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim()
      if (first && isPlausibleIp(first)) return first
    }
    const realIp = request.headers.get("x-real-ip")?.trim()
    if (realIp && isPlausibleIp(realIp)) return realIp
  }

  return "unknown"
}

function isPlausibleIp(ip: string): boolean {
  if (ip.length > 45) return false
  if (ip.includes(" ")) return false
  return true
}
