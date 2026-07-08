/**
 * Merkezi environment doğrulama.
 * Production'da kritik eksikler sessizce geçilmez.
 */
import { z } from "zod"

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const optionalNonEmpty = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL zorunludur."),
  JWT_SECRET: optionalNonEmpty,
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  COOKIE_DOMAIN: optionalNonEmpty,
  CDN_BASE_URL: optionalUrl,
  CDN_UPLOAD_URL: optionalUrl,
  CDN_UPLOAD_TOKEN: optionalNonEmpty,
  PAYTR_MERCHANT_ID: optionalNonEmpty,
  PAYTR_MERCHANT_KEY: optionalNonEmpty,
  PAYTR_MERCHANT_SALT: optionalNonEmpty,
  PAYTR_TEST_MODE: z
    .string()
    .optional()
    .transform((v) => v === "1"),
  BRAND_SUPPORT_EMAIL: optionalNonEmpty,
  BRAND_PHONE: optionalNonEmpty,
  BRAND_WHATSAPP: optionalNonEmpty,
  NEXT_PUBLIC_GA_ID: optionalNonEmpty,
  NEXT_PUBLIC_META_PIXEL_ID: optionalNonEmpty,
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: optionalNonEmpty,
  SENTRY_DSN: optionalNonEmpty,
  ALLOW_INDEXING: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined
      return v === "1" || v.toLowerCase() === "true"
    }),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  CRON_SECRET: optionalNonEmpty,
  EMAIL_OUTBOX_BATCH_SIZE: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  EMAIL_OUTBOX_MAX_ATTEMPTS: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  EMAIL_OUTBOX_RETRY_MINUTES: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  UPLOAD_CLEANUP_DRY_RUN: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined
      return v === "1" || v.toLowerCase() === "true"
    }),
  UPLOAD_CLEANUP_MIN_AGE_HOURS: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  WOO_BASE_URL: optionalUrl,
  WOO_CONSUMER_KEY: optionalNonEmpty,
  WOO_CONSUMER_SECRET: optionalNonEmpty,
})

export type AppEnv = z.infer<typeof envSchema> & {
  isProduction: boolean
  isDevelopment: boolean
  isTest: boolean
  jwtSecret: string | undefined
  siteUrl: string
}

let cached: AppEnv | null = null

function parseEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    throw new Error(`Environment doğrulama hatası: ${msg}`)
  }

  const raw = parsed.data
  const isProduction = raw.NODE_ENV === "production"
  const isDevelopment = raw.NODE_ENV === "development"
  const isTest = raw.NODE_ENV === "test"
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"

  if (isProduction && !isBuildPhase) {
    if (!raw.JWT_SECRET) {
      throw new Error("Production: JWT_SECRET zorunludur.")
    }
    if (raw.JWT_SECRET.length < 32) {
      throw new Error("Production: JWT_SECRET en az 32 karakter olmalıdır.")
    }
    if (!raw.NEXT_PUBLIC_SITE_URL) {
      throw new Error("Production: NEXT_PUBLIC_SITE_URL zorunludur.")
    }
    if (/localhost|127\.0\.0\.1/i.test(raw.NEXT_PUBLIC_SITE_URL)) {
      throw new Error("Production: NEXT_PUBLIC_SITE_URL localhost olamaz.")
    }
    try {
      new URL(raw.NEXT_PUBLIC_SITE_URL)
    } catch {
      throw new Error("Production: NEXT_PUBLIC_SITE_URL geçerli bir URL olmalıdır.")
    }
  }

  const siteUrl =
    raw.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (isProduction ? undefined : "http://localhost:3000")

  if (isProduction && !siteUrl) {
    throw new Error("Production: site URL çözümlenemedi.")
  }

  return {
    ...raw,
    isProduction,
    isDevelopment,
    isTest,
    jwtSecret: raw.JWT_SECRET,
    siteUrl: siteUrl ?? "http://localhost:3000",
  }
}

/** Doğrulanmış env — ilk çağrıda parse edilir. */
export function getEnv(): AppEnv {
  if (!cached) {
    cached = parseEnv()
  }
  return cached
}

/** Sunucu başlangıcında çağrılır (instrumentation). */
export function validateEnvOnStartup(): void {
  getEnv()
}

/** Test ortamında cache sıfırlama. */
export function resetEnvCacheForTests(): void {
  cached = null
}
