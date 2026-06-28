import { BRAND_SITE_URL } from "@/lib/brand"

/**
 * Varsayılan site URL'si merkezi brand config'den gelir.
 * Alan adı henüz netleşmediğinden hard-coded değil; NEXT_PUBLIC_SITE_URL env ile ayarlanır.
 */
export const DEFAULT_SITE_URL = BRAND_SITE_URL

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || DEFAULT_SITE_URL
}
