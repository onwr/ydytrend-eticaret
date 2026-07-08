export const HOMEPAGE_COMPONENT_KEYS = [
  "hero",
  "trust",
  "popular_categories",
  "new_arrivals",
  "bestsellers",
  "discounted",
  "featured",
  "custom_sections",
  "instagram",
  "newsletter",
  "faq",
] as const

export type HomepageComponentKey = (typeof HOMEPAGE_COMPONENT_KEYS)[number]

export interface HomepageComponentItem {
  key: HomepageComponentKey
  enabled: boolean
}

export const HOMEPAGE_COMPONENT_LABELS: Record<HomepageComponentKey, string> = {
  hero: "Hero / Slider",
  trust: "Güven Özellikleri",
  popular_categories: "Kategorileri Keşfet",
  new_arrivals: "Yeni Gelenler",
  bestsellers: "Çok Satanlar",
  discounted: "İndirimde",
  featured: "Sezon Koleksiyonu",
  custom_sections: "Özel Ürün Bölümleri",
  instagram: "Instagram",
  newsletter: "Bülten",
  faq: "Sık Sorulan Sorular",
}

export const HOMEPAGE_COMPONENT_ICONS: Record<HomepageComponentKey, string> = {
  hero: "🖼️",
  trust: "🛡️",
  popular_categories: "📂",
  new_arrivals: "✨",
  bestsellers: "🏆",
  discounted: "🏷️",
  featured: "⭐",
  custom_sections: "📦",
  instagram: "📸",
  newsletter: "📧",
  faq: "❓",
}

export const DEFAULT_COMPONENT_ORDER: HomepageComponentItem[] = HOMEPAGE_COMPONENT_KEYS.map(
  (key) => ({ key, enabled: true })
)

export function parseComponentOrder(json: string | null): HomepageComponentItem[] {
  if (!json) return DEFAULT_COMPONENT_ORDER
  try {
    const parsed = JSON.parse(json) as HomepageComponentItem[]
    if (!Array.isArray(parsed)) return DEFAULT_COMPONENT_ORDER

    // Yeni eklenen key'leri sona ekle (DB'de eksik olanlar)
    const existingKeys = new Set(parsed.map((i) => i.key))
    const missing = HOMEPAGE_COMPONENT_KEYS.filter((k) => !existingKeys.has(k))
    return [
      ...parsed.filter((i) => HOMEPAGE_COMPONENT_KEYS.includes(i.key)),
      ...missing.map((key) => ({ key, enabled: true })),
    ]
  } catch {
    return DEFAULT_COMPONENT_ORDER
  }
}
