import { getEnv } from "@/lib/env"

/** Production dışında veya ALLOW_INDEXING=false ise global noindex. */
export function isIndexingAllowed(): boolean {
  const raw = process.env.ALLOW_INDEXING?.trim().toLowerCase()
  if (raw === "false" || raw === "0") return false
  if (raw === "true" || raw === "1") return true

  try {
    const env = getEnv()
    if (env.isTest) return false
    if (!env.isProduction) return false
    return true
  } catch {
    return process.env.NODE_ENV === "production"
  }
}
