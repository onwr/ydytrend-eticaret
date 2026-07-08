type MemoryBucket = { count: number; resetAt: number }

const memoryBuckets = new Map<string, MemoryBucket>()

export type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds?: number
  backend: "memory"
}

function memoryAllow(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const b = memoryBuckets.get(key)
  if (!b || now > b.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, backend: "memory" }
  }
  if (b.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
      backend: "memory",
    }
  }
  b.count += 1
  return { allowed: true, backend: "memory" }
}

export async function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  return memoryAllow(key, maxRequests, windowMs)
}

export function consumeRateLimitSync(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  return memoryAllow(key, maxRequests, windowMs)
}

export const RATE_LIMITS = {
  login: { max: 10, windowMs: 15 * 60_000 },
  register: { max: 6, windowMs: 60 * 60_000 },
  forgotPasswordIp: { max: 8, windowMs: 15 * 60_000 },
  forgotPasswordEmail: { max: 5, windowMs: 60 * 60_000 },
  checkout: { max: 12, windowMs: 60_000 },
  newsletter: { max: 5, windowMs: 60_000 },
  search: { max: 60, windowMs: 60_000 },
  returnCreate: { max: 8, windowMs: 60 * 60_000 },
  orderCancel: { max: 10, windowMs: 60 * 60_000 },
  upload: { max: 30, windowMs: 60_000 },
  adminSensitive: { max: 40, windowMs: 60_000 },
} as const
