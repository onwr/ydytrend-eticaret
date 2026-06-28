import { getClientIp } from "@/lib/getClientIp"
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit"

export function rateLimitNewsletterSubscribe(ip: string) {
  return consumeRateLimit(
    `newsletter:${ip}`,
    RATE_LIMITS.newsletter.max,
    RATE_LIMITS.newsletter.windowMs
  )
}

export { getClientIp }
