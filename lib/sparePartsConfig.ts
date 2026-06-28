/**
 * YDY Trend — moda aksesuar kategori ve navigasyon yapılandırması.
 * Önceki sürümde telefon yedek parça verileri içeriyordu; YDY Trend için güncellendi.
 */

export type PopularCategoryItem = {
  name: string
  slug: string
  icon: string
}

export const POPULAR_CATEGORIES: PopularCategoryItem[] = [
  { name: "Takı", slug: "taki", icon: "jewelry" },
  { name: "Çanta", slug: "canta", icon: "bag" },
  { name: "Şapka", slug: "sapka", icon: "hat" },
  { name: "Aksesuar", slug: "aksesuar", icon: "accessory" },
  { name: "Küpe", slug: "kupe", icon: "earring" },
  { name: "Kolye", slug: "kolye", icon: "necklace" },
  { name: "Bileklik", slug: "bileklik", icon: "bracelet" },
  { name: "Yüzük", slug: "yuzuk", icon: "ring" },
]

export const BRAND_ITEMS = [
  { name: "Takı", slug: "taki", searchQuery: "Takı" },
  { name: "Çanta", slug: "canta", searchQuery: "Çanta" },
  { name: "Şapka", slug: "sapka", searchQuery: "Şapka" },
  { name: "Aksesuar", slug: "aksesuar", searchQuery: "Aksesuar" },
  { name: "Küpe", slug: "kupe", searchQuery: "Küpe" },
  { name: "Kolye", slug: "kolye", searchQuery: "Kolye" },
  { name: "Bileklik", slug: "bileklik", searchQuery: "Bileklik" },
  { name: "Yüzük", slug: "yuzuk", searchQuery: "Yüzük" },
] as const

export const DEVICE_BRANDS = BRAND_ITEMS.map((b) => b.name)

/** Ürün renk seçenekleri (varyant sistemi için) */
export const COLOR_OPTIONS = [
  "Altın",
  "Gümüş",
  "Rose Gold",
  "Siyah",
  "Beyaz",
  "Pembe",
  "Kırmızı",
  "Mavi",
  "Yeşil",
  "Bej",
] as const

/** Ürün beden/boyut seçenekleri (varyant sistemi için) */
export const SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "Standart",
  "Tek Ebat",
] as const

export type FallbackNavItem = {
  label: string
  href: string
  labelUppercase?: boolean
  children?: Array<{ label: string; href: string }>
}

/** DB menüsü boş/hatalı olduğunda kullanılan yedek navigasyon */
export const FALLBACK_HEADER_NAV: FallbackNavItem[] = [
  { label: "Yeni Gelenler", href: "/categories", labelUppercase: false },
  { label: "Takı", href: "/categories/taki", labelUppercase: false },
  { label: "Çanta", href: "/categories/canta", labelUppercase: false },
  { label: "Şapka", href: "/categories/sapka", labelUppercase: false },
  { label: "Aksesuar", href: "/categories/aksesuar", labelUppercase: false },
  { label: "Çok Satanlar", href: "/search?sort=popular", labelUppercase: false },
  { label: "İndirim", href: "/search?indirim=true", labelUppercase: false },
]

/** @deprecated Use FALLBACK_HEADER_NAV */
export const FALLBACK_SPARE_PARTS_NAV = FALLBACK_HEADER_NAV
