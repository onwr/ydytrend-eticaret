import { getClientIp } from "@/lib/getClientIp"
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit"

export { getClientIp }

export async function rateLimitCheckout(
  ip: string,
  maxRequests = RATE_LIMITS.checkout.max,
  windowMs = RATE_LIMITS.checkout.windowMs
) {
  return consumeRateLimit(`checkout:${ip}`, maxRequests, windowMs)
}
