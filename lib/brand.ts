/**
 * YDY Trend — merkezi marka yapılandırması.
 * Yalnızca public değerler; gizli anahtarları buraya ekleme.
 * Hem server hem client tarafında güvenle kullanılabilir.
 */

export const BRAND_NAME = "YDY Trend"
export const BRAND_SHORT = "YDY"
export const BRAND_TAGLINE = "Tarzını Tamamlayan Detaylar"
export const BRAND_DESCRIPTION =
  "Takı, çanta, şapka ve moda aksesuarlarıyla stilinizi yansıtın."
export const BRAND_DESCRIPTION_LONG =
  "Tarzınızı tamamlayan takı, çanta, şapka ve moda aksesuarlarını YDY Trend'de keşfedin. Modern, zarif ve erişilebilir moda."

/**
 * Site URL — NEXT_PUBLIC_SITE_URL env üzerinden; geliştirme için localhost fallback.
 * Alan adı henüz netleşmediğinden kod içine hard-code edilmez.
 */
export const BRAND_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"

/** Destek e-postası — env ile override edilebilir */
export const BRAND_SUPPORT_EMAIL =
  process.env.BRAND_SUPPORT_EMAIL ?? "destek@ydytrend.com"

export const BRAND_PHONE = process.env.BRAND_PHONE ?? "+90 541 450 78 85"
export const BRAND_WHATSAPP = process.env.BRAND_WHATSAPP ?? "905414507885"

// Sosyal medya
export const BRAND_INSTAGRAM = "https://instagram.com/ydytrend"
export const BRAND_TIKTOK = "https://tiktok.com/@ydytrend"

// Logo dosyaları — /public/brand/ altında yönetilir
export const BRAND_LOGO_PATH = "/brand/logo.png"
export const BRAND_LOGO_HORIZONTAL_PATH = "/brand/logo-horizontal.png"
export const BRAND_LOGO_MARK_PATH = "/brand/logo-mark.png"
export const BRAND_FAVICON_PATH = "/brand/favicon.ico"
export const BRAND_OG_IMAGE_PATH = "/brand/og-image.jpg"

/**
 * Geçici uyumluluk: mevcut /public/logo.png henüz varken bu yolu kullan.
 * /public/brand/logo.png hazır olunca BRAND_LOGO_PATH'e geç.
 */
export const BRAND_LOGO_ACTIVE_PATH = "/logo.png"

// SEO
export const BRAND_SEO_TITLE = `${BRAND_NAME} | Takı, Çanta, Şapka ve Moda Aksesuarları`
export const BRAND_SEO_TITLE_TEMPLATE = `%s | ${BRAND_NAME}`
export const BRAND_SEO_DESCRIPTION =
  "Tarzınızı tamamlayan takı, çanta, şapka ve moda aksesuarlarını YDY Trend'de keşfedin."
export const BRAND_SEO_KEYWORDS =
  "takı, çanta, şapka, moda aksesuar, küpe, kolye, bileklik, kadın aksesuar, YDY Trend, online moda"

// Para birimi ve konum
export const BRAND_CURRENCY = "TRY"
export const BRAND_CURRENCY_SYMBOL = "₺"
export const BRAND_COUNTRY = "TR"
export const BRAND_LOCALE = "tr_TR"

/**
 * Renk değerleri — Tailwind'e erişilemeyen yerler için (e-posta şablonları vb.)
 * CSS değişkenleri globals.css'te tanımlıdır.
 */
export const COLOR_PRIMARY = "#B9914B"       // mat altın
export const COLOR_PRIMARY_DARK = "#232020"  // koyu antrasit
export const COLOR_BLUSH = "#E8C8CE"         // toz pembe
export const COLOR_BLUSH_SOFT = "#F7ECEE"   // açık pembe
export const COLOR_GOLD = "#B9914B"
export const COLOR_GOLD_SOFT = "#D9BF89"
export const COLOR_PAGE_BG = "#FCF9F8"
export const COLOR_TEXT = "#232020"
export const COLOR_TEXT_MUTED = "#746C6B"
export const COLOR_SUCCESS = "#16A36A"
export const COLOR_DANGER = "#F04438"
