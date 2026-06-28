import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { CouponType, PrismaClient } from "../generated/prisma/client"
import * as dotenv from "dotenv"
import { DEFAULT_HEADER_NAV_ITEMS } from "../lib/defaultHeaderNav"
import { BRAND_NAME, BRAND_SEO_DESCRIPTION, BRAND_SEO_KEYWORDS, BRAND_SEO_TITLE, BRAND_SEO_TITLE_TEMPLATE } from "../lib/brand"

dotenv.config()

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error("DATABASE_URL tanımlı değil.")
}

const adapter = new PrismaMariaDb(url)
const prisma = new PrismaClient({ adapter })

const productSeeds = [
  { name: "Altın Kaplama Zarif Kolye", price: 349.9, compareAt: 499.9, category: "Kolye", featured: true },
  { name: "Gümüş İnce Bileklik", price: 199.9, compareAt: 299.9, category: "Bileklik", featured: true },
  { name: "Toz Pembe Mini Kol Çantası", price: 899.0, compareAt: 1199.0, category: "Çanta", featured: true },
  { name: "Naturel Hasır Yaz Şapkası", price: 249.9, compareAt: null, category: "Şapka", featured: true },
  { name: "Rose Gold Halka Küpe Seti", price: 149.9, compareAt: 199.9, category: "Küpe", featured: false },
  { name: "Taşlı Altın Yüzük", price: 279.9, compareAt: 399.9, category: "Yüzük", featured: false },
  { name: "Siyah Deri Omuz Çantası", price: 1099.0, compareAt: null, category: "Çanta", featured: false },
  { name: "Bej Hasır Plaj Çantası", price: 449.9, compareAt: 649.9, category: "Çanta", featured: false },
  { name: "Zincir Detaylı Kolye", price: 229.9, compareAt: null, category: "Kolye", featured: false },
  { name: "Pembe Ip Bileklik Seti", price: 99.9, compareAt: 149.9, category: "Bileklik", featured: false },
  { name: "Şeffaf Visor Şapka", price: 179.9, compareAt: null, category: "Şapka", featured: false },
  { name: "Vintage Sarkan Küpe", price: 189.9, compareAt: 269.9, category: "Küpe", featured: false },
  { name: "Minimalist Altın Yüzük", price: 159.9, compareAt: null, category: "Yüzük", featured: false },
  { name: "Krem Kapitone Mini Çanta", price: 749.9, compareAt: 999.9, category: "Çanta", featured: false },
  { name: "Mercan Rengi Boncuk Kolye", price: 129.9, compareAt: null, category: "Kolye", featured: false },
  { name: "Leopar Desenli Kova Şapka", price: 299.9, compareAt: 399.9, category: "Şapka", featured: false },
]

async function main() {
  console.log("Seeding products...")

  for (let i = 0; i < productSeeds.length; i++) {
    const seed = productSeeds[i]!
    const slug = `ydy-${seed.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${i + 1}`
    const image = `/urunler/urun${(i % 8) + 1}.jpg`

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: seed.name,
        slug,
        basePrice: seed.price,
        compareAtPrice: seed.compareAt,
        description: `${seed.name} — ${BRAND_NAME} koleksiyonundan.`,
        isActive: true,
        isFeatured: seed.featured,
        images: {
          create: [{ url: image, isCover: true, alt: seed.name }],
        },
        variants: {
          create: [
            {
              name: "Standart",
              price: seed.price,
              stock: 50,
              isActive: true,
              sku: `YDY-${String(i + 1).padStart(3, "0")}-STD`,
            },
          ],
        },
      },
    })
    console.log(`Created product: ${product.name}`)
  }

  console.log("Seeding settings...")
  const settings = [
    { key: "FREE_SHIPPING_THRESHOLD", value: "750", type: "number" },
    { key: "STANDARD_SHIPPING_COST", value: "49.90", type: "number" },
    { key: "SITE_TITLE_DEFAULT", value: BRAND_SEO_TITLE, type: "string" },
    { key: "SITE_TITLE_TEMPLATE", value: BRAND_SEO_TITLE_TEMPLATE, type: "string" },
    { key: "SITE_META_DESCRIPTION", value: BRAND_SEO_DESCRIPTION, type: "string" },
    { key: "SITE_META_KEYWORDS", value: BRAND_SEO_KEYWORDS, type: "string" },
    { key: "SITE_OG_SITE_NAME", value: BRAND_NAME, type: "string" },
    { key: "SITE_FAVICON_URL", value: "/logo.png", type: "string" },
    { key: "SITE_OG_IMAGE_URL", value: "/logo.png", type: "string" },
    { key: "FOOTER_SOCIAL_FACEBOOK_URL", value: "", type: "string" },
    { key: "FOOTER_SOCIAL_TWITTER_URL", value: "", type: "string" },
    { key: "FOOTER_SOCIAL_INSTAGRAM_URL", value: "", type: "string" },
    { key: "FOOTER_SOCIAL_YOUTUBE_URL", value: "", type: "string" },
    { key: "FOOTER_SOCIAL_GOOGLE_URL", value: "", type: "string" },
    { key: "BANK_ACCOUNT_HOLDER", value: BRAND_NAME, type: "string" },
    { key: "BANK_NAME", value: "", type: "string" },
    { key: "BANK_IBAN", value: "", type: "string" },
    { key: "BANK_TRANSFER_NOTE", value: "Havale/EFT açıklama alanına sipariş numaranızı yazınız.", type: "string" },
    { key: "SMTP_HOST", value: "", type: "string" },
    { key: "SMTP_PORT", value: "587", type: "string" },
    { key: "SMTP_ENCRYPTION", value: "tls", type: "string" },
    { key: "SMTP_USER", value: "", type: "string" },
    { key: "SMTP_PASSWORD", value: "", type: "string" },
    { key: "SMTP_FROM_EMAIL", value: "", type: "string" },
    { key: "SMTP_FROM_NAME", value: "", type: "string" },
    { key: "SMTP_AUTO_TLS", value: "true", type: "string" },
    { key: "SMTP_MAIL_ENABLED", value: "false", type: "string" },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  console.log("Seeding header navigation...")
  const navCount = await prisma.headerNavItem.count()
  if (navCount === 0) {
    await prisma.headerNavItem.createMany({
      data: DEFAULT_HEADER_NAV_ITEMS.map((row) => ({
        label: row.label,
        href: row.href,
        labelUppercase: row.labelUppercase,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        openInNewTab: row.openInNewTab,
      })),
    })
    console.log(`Inserted ${DEFAULT_HEADER_NAV_ITEMS.length} header nav items`)
  }

  console.log("Seeding coupons...")
  const coupons = [
    { code: "HOSGELDIN10", type: "PERCENTAGE", value: 10, description: "%10 İlk Alışveriş İndirimi" },
    { code: "YDY100", type: "FIXED", value: 100, description: "100 TL İndirim" },
  ]

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { value: c.value, type: c.type as CouponType },
      create: {
        code: c.code,
        type: c.type as CouponType,
        value: c.value,
        description: c.description,
        isActive: true,
      },
    })
  }

  // ── Attribute seed (idempotent) ───────────────────────────────────────────
  const attributeSeeds: {
    name: string; slug: string; type: string; isVariant: boolean; isFilterable: boolean; values: { value: string; slug: string; colorHex?: string }[]
  }[] = [
    {
      name: "Renk", slug: "renk", type: "COLOR", isVariant: true, isFilterable: true,
      values: [
        { value: "Altın", slug: "altin", colorHex: "#C9A84C" },
        { value: "Gümüş", slug: "gumus", colorHex: "#A8A9AD" },
        { value: "Rose Gold", slug: "rose-gold", colorHex: "#B76E79" },
        { value: "Beyaz", slug: "beyaz", colorHex: "#FFFFFF" },
        { value: "Siyah", slug: "siyah", colorHex: "#1A1A1A" },
        { value: "Bej", slug: "bej", colorHex: "#C4A882" },
        { value: "Pembe", slug: "pembe", colorHex: "#F4A7B9" },
      ],
    },
    {
      name: "Beden", slug: "beden", type: "SIZE", isVariant: true, isFilterable: true,
      values: [
        { value: "XS", slug: "xs" },
        { value: "S", slug: "s" },
        { value: "M", slug: "m" },
        { value: "L", slug: "l" },
        { value: "XL", slug: "xl" },
        { value: "Tek Ebat", slug: "tek-ebat" },
      ],
    },
    {
      name: "Uzunluk", slug: "uzunluk", type: "SIZE", isVariant: true, isFilterable: true,
      values: [
        { value: "40 cm", slug: "40-cm" },
        { value: "45 cm", slug: "45-cm" },
        { value: "50 cm", slug: "50-cm" },
        { value: "60 cm", slug: "60-cm" },
        { value: "70 cm", slug: "70-cm" },
      ],
    },
    {
      name: "Materyal", slug: "materyal", type: "MATERIAL", isVariant: false, isFilterable: true,
      values: [
        { value: "925 Gümüş", slug: "925-gumus" },
        { value: "Altın Kaplama", slug: "altin-kaplama" },
        { value: "Rose Gold Kaplama", slug: "rose-gold-kaplama" },
        { value: "Paslanmaz Çelik", slug: "paslanmaz-celik" },
        { value: "Deri", slug: "deri" },
        { value: "Hasır", slug: "hasir" },
      ],
    },
    {
      name: "Kaplama", slug: "kaplama", type: "SELECT", isVariant: false, isFilterable: false,
      values: [
        { value: "Altın Kaplama", slug: "altin-kaplama" },
        { value: "Rodyo Kaplama", slug: "rodyo-kaplama" },
        { value: "Rose Gold Kaplama", slug: "rose-gold-kaplama" },
        { value: "Kaplamasız", slug: "kaplamasiz" },
      ],
    },
    {
      name: "Çanta Boyutu", slug: "canta-boyutu", type: "SIZE", isVariant: true, isFilterable: true,
      values: [
        { value: "Mini", slug: "mini" },
        { value: "Küçük", slug: "kucuk" },
        { value: "Orta", slug: "orta" },
        { value: "Büyük", slug: "buyuk" },
      ],
    },
    {
      name: "Stil", slug: "stil", type: "SELECT", isVariant: false, isFilterable: true,
      values: [
        { value: "Klasik", slug: "klasik" },
        { value: "Bohemian", slug: "bohemian" },
        { value: "Minimalist", slug: "minimalist" },
        { value: "Vintage", slug: "vintage" },
        { value: "Spor", slug: "spor" },
      ],
    },
  ]

  for (const attrSeed of attributeSeeds) {
    const attr = await prisma.attribute.upsert({
      where: { slug: attrSeed.slug },
      update: { name: attrSeed.name, isFilterable: attrSeed.isFilterable, isVariant: attrSeed.isVariant },
      create: {
        name: attrSeed.name,
        slug: attrSeed.slug,
        type: attrSeed.type as "SELECT" | "COLOR" | "SIZE" | "MATERIAL" | "TEXT",
        isVariant: attrSeed.isVariant,
        isFilterable: attrSeed.isFilterable,
        isRequired: false,
        isActive: true,
      },
    })
    for (const v of attrSeed.values) {
      await prisma.attributeValue.upsert({
        where: { attributeId_slug: { attributeId: attr.id, slug: v.slug } },
        update: { value: v.value, colorHex: v.colorHex ?? null },
        create: {
          attributeId: attr.id,
          value: v.value,
          slug: v.slug,
          colorHex: v.colorHex ?? null,
          isActive: true,
        },
      })
    }
  }

  console.log("Seeding finished.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
