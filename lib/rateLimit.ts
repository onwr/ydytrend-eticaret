import { getEnv } from "@/lib/env"
import { getRedisClient } from "@/lib/redis"

type MemoryBucket = { count: number; resetAt: number }

const memoryBuckets = new Map<string, MemoryBucket>()
let memoryFallbackWarned = false

export type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds?: number
  backend: "redis" | "memory"
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

async function redisAllow(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const redis = getRedisClient()
  if (!redis) return null

  const redisKey = `rl:${key}`
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))

  try {
    const count = await redis.incr(redisKey)
    if (count === 1) {
      await redis.expire(redisKey, windowSec)
    }
    if (count > maxRequests) {
      const ttl = await redis.ttl(redisKey)
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, ttl > 0 ? ttl : windowSec),
        backend: "redis",
      }
    }
    return { allowed: true, backend: "redis" }
  } catch {
    return null
  }
}

/** Rate limit tüketimi — Redis varsa öncelikli, yoksa/hata varsa bellek fallback. */
export async function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const env = getEnv()
  if (env.redisConfigured) {
    const redisResult = await redisAllow(key, maxRequests, windowMs)
    if (redisResult) return redisResult
  }

  if (env.isProduction && !memoryFallbackWarned) {
    memoryFallbackWarned = true
    console.warn("[rateLimit] Redis kullanılamıyor — bellek içi fallback aktif.")
  }

  return memoryAllow(key, maxRequests, windowMs)
}

/** Senkron bellek limiti (Edge/middleware gibi async kullanılamayan yerler için). */
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
