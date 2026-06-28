import Redis from "ioredis"
import { getEnv } from "@/lib/env"
import { logger } from "@/lib/logger"

let client: Redis | null = null
let connectFailed = false

/** Redis istemcisi — yapılandırılmamışsa null. Bağlantı hatasında bellek fallback'e düşülür. */
export function getRedisClient(): Redis | null {
  if (connectFailed) return null
  if (client) return client

  const env = getEnv()
  if (!env.redisConfigured) return null

  try {
    if (env.REDIS_URL) {
      client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      })
    } else {
      client = new Redis({
        host: env.REDIS_HOST ?? "localhost",
        port: env.REDIS_PORT ?? 6379,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      })
    }

    client.on("error", (err) => {
      logger.warn("Redis connection error — rate limit memory fallback", {
        message: err.message,
      })
      connectFailed = true
    })

    void client.connect().catch(() => {
      connectFailed = true
    })

    return client
  } catch {
    connectFailed = true
    return null
  }
}
