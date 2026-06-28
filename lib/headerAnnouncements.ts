export const HEADER_ANNOUNCEMENTS_KEY = "HEADER_ANNOUNCEMENTS"

export const DEFAULT_HEADER_ANNOUNCEMENTS = [
  "500 TL Üzeri Kargo Ücretsiz",
  "Aynı Gün Kargo Seçeneği",
  "Güvenli Ödeme",
  "Yeni Sezon Ürünler",
]

export function normalizeAnnouncements(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0)
}
