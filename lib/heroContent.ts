export type HeroStyle = "split" | "full_image"

export const HERO_OBJECT_POSITION_OPTIONS = [
  { value: "center", label: "Orta (varsayılan)" },
  { value: "top", label: "Üst" },
  { value: "bottom", label: "Alt" },
  { value: "left", label: "Sol" },
  { value: "right", label: "Sağ" },
  { value: "center top", label: "Orta üst" },
  { value: "center bottom", label: "Orta alt" },
  { value: "left center", label: "Sol orta" },
  { value: "right center", label: "Sağ orta" },
] as const

export type HeroObjectPosition = (typeof HERO_OBJECT_POSITION_OPTIONS)[number]["value"]

export const HERO_STYLE_OPTIONS: { value: HeroStyle; label: string; description: string }[] = [
  {
    value: "split",
    label: "Split Hero",
    description: "Solda metin, sağda görsel",
  },
  {
    value: "full_image",
    label: "Full Image Hero",
    description: "Yalnızca büyük hero görseli",
  },
]

export type HeroSlideContent = {
  id: number
  heroStyle: HeroStyle
  badgeText: string
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
  button2Text: string
  button2Link: string
  features: string[]
  imageUrl: string
  mobileImageUrl: string | null
  imageObjectPosition: HeroObjectPosition
  linkUrl: string | null
  imageOnlyLink: string | null
  imageOnlyOpenInNewTab: boolean
}

export const HERO_DEFAULTS: Omit<
  HeroSlideContent,
  | "id"
  | "imageUrl"
  | "mobileImageUrl"
  | "imageObjectPosition"
  | "linkUrl"
  | "imageOnlyLink"
  | "heroStyle"
  | "imageOnlyOpenInNewTab"
> = {
  badgeText: "Yeni Koleksiyon",
  title: "Tarzını Tamamlayan Detaylar",
  subtitle:
    "Takıdan çantaya, şapkadan günlük aksesuarlarına kadar stiline eşlik edecek parçaları keşfet.",
  buttonText: "Alışverişe Başla",
  buttonLink: "/search",
  button2Text: "Yeni Gelenleri Keşfet",
  button2Link: "/categories",
  features: [
    "Ücretsiz Kargo",
    "Güvenli Ödeme",
    "Hızlı Teslimat",
    "Yeni Sezon Ürünler",
  ],
}

export const HERO_FALLBACK_IMAGE = ""

type DbSliderRow = {
  id: number
  heroStyle?: string | null
  badgeText?: string | null
  title?: string | null
  subtitle?: string | null
  buttonText?: string | null
  buttonLink?: string | null
  button2Text?: string | null
  button2Link?: string | null
  featuresJson?: string | null
  imageUrl: string
  mobileImageUrl?: string | null
  imageObjectPosition?: string | null
  linkUrl?: string | null
  imageOnlyLink?: string | null
  imageOnlyOpenInNewTab?: boolean | null
}

export function parseHeroStyle(raw: string | null | undefined): HeroStyle {
  return raw === "full_image" ? "full_image" : "split"
}

const HERO_OBJECT_POSITION_SET = new Set<string>(
  HERO_OBJECT_POSITION_OPTIONS.map((o) => o.value)
)

export function parseHeroObjectPosition(raw: string | null | undefined): HeroObjectPosition {
  const v = raw?.trim().toLowerCase()
  if (v && HERO_OBJECT_POSITION_SET.has(v)) {
    return v as HeroObjectPosition
  }
  return "center"
}

export function resolveFullImageSources(slide: HeroSlideContent): {
  desktop: string
  mobile: string
  objectPosition: HeroObjectPosition
} {
  const desktop = slide.imageUrl?.trim() || HERO_FALLBACK_IMAGE
  const mobile = slide.mobileImageUrl?.trim() || desktop
  return {
    desktop,
    mobile,
    objectPosition: parseHeroObjectPosition(slide.imageObjectPosition),
  }
}

export function parseHeroFeatures(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [...HERO_DEFAULTS.features]
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...HERO_DEFAULTS.features]
    const items = parsed
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .slice(0, 4)
    return items.length > 0 ? items : [...HERO_DEFAULTS.features]
  } catch {
    return [...HERO_DEFAULTS.features]
  }
}

export function serializeHeroFeatures(features: string[]): string {
  return JSON.stringify(
    features.map((f) => f.trim()).filter(Boolean).slice(0, 4)
  )
}

function isValidHeroLink(value: string): boolean {
  const v = value.trim()
  if (!v) return true
  if (v.startsWith("/")) return true
  try {
    const url = new URL(v)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function validateHeroForm(form: Record<string, unknown>): string | null {
  const style = parseHeroStyle(String(form.heroStyle ?? ""))
  const imageUrl = String(form.imageUrl ?? "").trim()

  if (style === "full_image" && !imageUrl) {
    return "Full Image hero için görsel zorunludur."
  }

  const links = [
    String(form.buttonLink ?? ""),
    String(form.button2Link ?? ""),
    String(form.linkUrl ?? ""),
    String(form.imageOnlyLink ?? ""),
  ]

  for (const link of links) {
    if (link.trim() && !isValidHeroLink(link)) {
      return "Link alanları / ile başlamalı veya geçerli bir http(s) URL olmalıdır."
    }
  }

  return null
}

export function resolveFullImageHref(slide: HeroSlideContent): string | null {
  const href = slide.imageOnlyLink?.trim() || slide.linkUrl?.trim()
  return href || null
}

/** full_image seçili ama görsel yoksa split'e düş */
export function effectiveHeroStyle(slide: HeroSlideContent): HeroStyle {
  if (slide.heroStyle === "full_image" && slide.imageUrl?.trim()) {
    return "full_image"
  }
  return "split"
}

export function normalizeHeroSlide(row: DbSliderRow): HeroSlideContent {
  return {
    id: row.id,
    heroStyle: parseHeroStyle(row.heroStyle),
    badgeText: row.badgeText?.trim() || HERO_DEFAULTS.badgeText,
    title: row.title?.trim() || HERO_DEFAULTS.title,
    subtitle: row.subtitle?.trim() || HERO_DEFAULTS.subtitle,
    buttonText: row.buttonText?.trim() || HERO_DEFAULTS.buttonText,
    buttonLink: row.buttonLink?.trim() || row.linkUrl?.trim() || HERO_DEFAULTS.buttonLink,
    button2Text: row.button2Text?.trim() || HERO_DEFAULTS.button2Text,
    button2Link: row.button2Link?.trim() || HERO_DEFAULTS.button2Link,
    features: parseHeroFeatures(row.featuresJson),
    imageUrl: row.imageUrl,
    mobileImageUrl: row.mobileImageUrl?.trim() || null,
    imageObjectPosition: parseHeroObjectPosition(row.imageObjectPosition),
    linkUrl: row.linkUrl?.trim() || null,
    imageOnlyLink: row.imageOnlyLink?.trim() || null,
    imageOnlyOpenInNewTab: row.imageOnlyOpenInNewTab === true,
  }
}

export function defaultHeroSlideForm() {
  return {
    heroStyle: "split" as HeroStyle,
    badgeText: HERO_DEFAULTS.badgeText,
    title: HERO_DEFAULTS.title,
    subtitle: HERO_DEFAULTS.subtitle,
    buttonText: HERO_DEFAULTS.buttonText,
    buttonLink: HERO_DEFAULTS.buttonLink,
    button2Text: HERO_DEFAULTS.button2Text,
    button2Link: HERO_DEFAULTS.button2Link,
    feature1: HERO_DEFAULTS.features[0] ?? "",
    feature2: HERO_DEFAULTS.features[1] ?? "",
    feature3: HERO_DEFAULTS.features[2] ?? "",
    feature4: HERO_DEFAULTS.features[3] ?? "",
    imageUrl: "",
    mobileImageUrl: "",
    imageObjectPosition: "center" as HeroObjectPosition,
    linkUrl: "",
    imageOnlyLink: "",
    imageOnlyOpenInNewTab: false,
    sortOrder: 0,
    isActive: true,
  }
}

export function heroFormToPayload(form: Record<string, unknown>) {
  const features = [
    String(form.feature1 ?? "").trim(),
    String(form.feature2 ?? "").trim(),
    String(form.feature3 ?? "").trim(),
    String(form.feature4 ?? "").trim(),
  ].filter(Boolean)

  return {
    heroStyle: parseHeroStyle(String(form.heroStyle ?? "")),
    badgeText: String(form.badgeText ?? "").trim() || null,
    title: String(form.title ?? "").trim() || null,
    subtitle: String(form.subtitle ?? "").trim() || null,
    buttonText: String(form.buttonText ?? "").trim() || null,
    buttonLink: String(form.buttonLink ?? "").trim() || null,
    button2Text: String(form.button2Text ?? "").trim() || null,
    button2Link: String(form.button2Link ?? "").trim() || null,
    featuresJson: features.length > 0 ? serializeHeroFeatures(features) : null,
    imageUrl: form.imageUrl,
    mobileImageUrl: String(form.mobileImageUrl ?? "").trim() || null,
    imageObjectPosition: parseHeroObjectPosition(String(form.imageObjectPosition ?? "")),
    linkUrl: String(form.linkUrl ?? "").trim() || null,
    imageOnlyLink: String(form.imageOnlyLink ?? "").trim() || null,
    imageOnlyOpenInNewTab: form.imageOnlyOpenInNewTab === true,
    sortOrder: parseInt(String(form.sortOrder ?? "0"), 10) || 0,
    isActive: form.isActive !== false,
  }
}

export function sliderToHeroForm(slider: DbSliderRow & { sortOrder?: number; isActive?: boolean }) {
  const features = parseHeroFeatures(slider.featuresJson)
  return {
    heroStyle: parseHeroStyle(slider.heroStyle),
    badgeText: slider.badgeText ?? "",
    title: slider.title ?? "",
    subtitle: slider.subtitle ?? "",
    buttonText: slider.buttonText ?? "",
    buttonLink: slider.buttonLink ?? "",
    button2Text: slider.button2Text ?? "",
    button2Link: slider.button2Link ?? "",
    feature1: features[0] ?? "",
    feature2: features[1] ?? "",
    feature3: features[2] ?? "",
    feature4: features[3] ?? "",
    imageUrl: slider.imageUrl ?? "",
    mobileImageUrl: slider.mobileImageUrl ?? "",
    imageObjectPosition: parseHeroObjectPosition(slider.imageObjectPosition),
    linkUrl: slider.linkUrl ?? "",
    imageOnlyLink: slider.imageOnlyLink ?? "",
    imageOnlyOpenInNewTab: slider.imageOnlyOpenInNewTab === true,
    sortOrder: slider.sortOrder ?? 0,
    isActive: slider.isActive ?? true,
  }
}
