import { consumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit"

export async function rateLimitForgotPasswordByIp(ip: string) {
  return consumeRateLimit(
    `fp:ip:${ip}`,
    RATE_LIMITS.forgotPasswordIp.max,
    RATE_LIMITS.forgotPasswordIp.windowMs
  )
}

export async function rateLimitForgotPasswordByEmail(emailNormalized: string) {
  return consumeRateLimit(
    `fp:em:${emailNormalized}`,
    RATE_LIMITS.forgotPasswordEmail.max,
    RATE_LIMITS.forgotPasswordEmail.windowMs
  )
}
