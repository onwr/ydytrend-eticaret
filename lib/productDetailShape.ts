export type ProductDetailInstallment = {
  months: number
  monthlyAmountText: string
}

export type ProductDetailVariantAttribute = {
  key: string
  slug: string
  type: string
  value: string
  colorHex?: string | null
}

export type ProductDetailVariant = {
  id: number
  label: string
  sku: string
  priceText: string
  compareAtPriceText?: string
  discountPct?: number
  stock: number
  stockText: string
  isActive: boolean
  attributes: ProductVariantAttribute[]
  richAttributes: ProductDetailVariantAttribute[]
  imageUrl?: string | null
}

export type ProductVariantAttribute = {
  key: string
  value: string
}

export type ProductDetailImage = {
  src: string
  alt: string
}

export type ProductAccordionItem = {
  id: "features" | "comments" | "payment"
  title: string
  content: string
}

import { resolveSellPrice, resolveVariantSellPrice } from "@/lib/pricing"
import { getVariantAttributeMap, attributeMapToList } from "@/lib/variantAttributes"

export type ProductDetailViewModel = {
  productId: number
  slug: string
  categoryLabel: string
  extraCategories: { name: string; slug: string }[]
  title: string
  rating: number
  reviewCount: number
  priceText: string
  /** Analytics / JSON-LD ile uyumlu sayısal fiyat */
  displayPrice: number
  compareAtPriceText?: string
  discountPct?: number
  installmentsLabel: string
  phoneOrderLabel: string
  images: ProductDetailImage[]
  variants: ProductDetailVariant[]
  accordions: ProductAccordionItem[]
  installmentOptions: ProductDetailInstallment[]
  baseAttributes: ProductVariantAttribute[]
}

type ApiImage = {
  url: string
  alt?: string | null
}

type RelationalAttrRow = {
  attribute: { id: number; name: string; slug: string; type: string }
  value: { id: number; value: string; slug: string; colorHex?: string | null }
}

type ApiVariant = {
  id: number
  name: string
  sku?: string | null
  price: number | string
  compareAtPrice?: number | string | null
  stock: number
  isActive?: boolean
  /** Yeni ilişkisel yapı */
  attributeValues?: RelationalAttrRow[] | null
  /** Eski JSON fallback */
  attributes?: Record<string, string> | null
  attributesJson?: string | null
  imageUrl?: string | null
}

type ApiProductLike = {
  id: number
  slug: string
  name: string
  description?: string | null
  shortDescription?: string | null
  category?: { name?: string | null } | null
  basePrice: number | string
  compareAtPrice?: number | string | null
  attributes?: Record<string, string> | null
  images?: ApiImage[]
  variants?: ApiVariant[]
}

const DEFAULT_FEATURES_PLACEHOLDER =
  "Marka, model ve teknik özellikler ürün açıklamasında yer alır.\nDetaylı bilgi için aşağıdaki ürün açıklamasına bakın."

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function buildFeaturesContent(apiProduct: ApiProductLike) {
  const raw =
    apiProduct.shortDescription?.trim() ||
    apiProduct.description?.trim() ||
    ""
  if (!raw) return DEFAULT_FEATURES_PLACEHOLDER
  const text = raw.includes("<") ? stripHtml(raw) : raw
  return text || DEFAULT_FEATURES_PLACEHOLDER
}

function toPriceText(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value)
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount)
}

function toInstallmentText(value: number | string, month: number) {
  const amount = typeof value === "number" ? value : Number(value)
  const monthly = Number.isNaN(amount) ? 0 : amount / month
  return toPriceText(monthly)
}

function toStockText(stock: number) {
  if (stock <= 0) return "Stokta yok"
  if (stock <= 3) return `Son ${stock} ürün`
  return `${stock} adet stokta`
}

function toAttributeList(attributes?: Record<string, string> | null): ProductVariantAttribute[] {
  if (!attributes) return []
  return Object.entries(attributes).map(([key, value]) => ({ key, value }))
}

export function mapApiProductToDetailViewModel(
  apiProduct: ApiProductLike,
  opts?: { phoneOrderLabel?: string; extraCategories?: { name: string; slug: string }[] }
): ProductDetailViewModel {
  const basePrice = Number(apiProduct.basePrice)
  const productCompare = apiProduct.compareAtPrice ? Number(apiProduct.compareAtPrice) : null
  const productPricing = resolveSellPrice(basePrice, productCompare)

  const variants: ProductDetailVariant[] =
    apiProduct.variants?.map((item) => {
      const vBasePrice = Number(item.price)
      const vComparePrice = item.compareAtPrice ? Number(item.compareAtPrice) : null
      const vPricing = resolveVariantSellPrice(
        vBasePrice,
        vComparePrice,
        basePrice,
        productCompare
      )

      // Rich attributes (ilişkisel)
      const richAttributes: ProductDetailVariantAttribute[] = item.attributeValues
        ? item.attributeValues.map((av) => ({
            key: av.attribute.name,
            slug: av.attribute.slug,
            type: av.attribute.type,
            value: av.value.value,
            colorHex: av.value.colorHex ?? null,
          }))
        : []

      return {
        id: item.id,
        label: item.name,
        sku: item.sku ?? `LMS-${item.id}`,
        priceText: toPriceText(vPricing.sellPrice),
        compareAtPriceText: vPricing.listPrice ? toPriceText(vPricing.listPrice) : undefined,
        discountPct: vPricing.discountPct,
        stock: item.stock,
        stockText: toStockText(item.stock),
        isActive: item.isActive !== false,
        attributes: item.attributeValues
          ? attributeMapToList(getVariantAttributeMap({ attributeValues: item.attributeValues }))
          : item.attributes
          ? toAttributeList(item.attributes)
          : toAttributeList(
              item.attributesJson ? (JSON.parse(item.attributesJson) as Record<string, string>) : null
            ),
        richAttributes,
        imageUrl: item.imageUrl ?? null,
      }
    }) ?? []

  const images =
    apiProduct.images?.map((item, index) => ({
      src: item.url,
      alt: item.alt ?? `${apiProduct.name} görsel ${index + 1}`,
    })) ?? []

  const installmentMonths = [3, 6, 9]
  const installmentOptions = installmentMonths.map((month) => ({
    months: month,
    monthlyAmountText: toInstallmentText(productPricing.sellPrice, month),
  }))

  return {
    productId: apiProduct.id,
    slug: apiProduct.slug,
    categoryLabel: apiProduct.category?.name ?? "Moda Aksesuar",
    extraCategories: opts?.extraCategories ?? [],
    title: apiProduct.name,
    rating: 0,
    reviewCount: 0,
    priceText: toPriceText(productPricing.sellPrice),
    displayPrice: productPricing.sellPrice,
    compareAtPriceText: productPricing.listPrice ? toPriceText(productPricing.listPrice) : undefined,
    discountPct: productPricing.discountPct,
    installmentsLabel: `${installmentOptions[0]?.monthlyAmountText ?? toPriceText(productPricing.sellPrice)}'den başlayan taksitlerle`,
    phoneOrderLabel: opts?.phoneOrderLabel ?? "Telefonla Sipariş Ver",
    images,
    variants,
    accordions: [
      {
        id: "features",
        title: "Ürün Özellikleri",
        content: buildFeaturesContent(apiProduct),
      },
      {
        id: "comments",
        title: "Yorumlar (0)",
        content: "Bu ürün için henüz yorum yapılmadı.",
      },
      {
        id: "payment",
        title: "Ödeme Seçenekleri",
        content: installmentOptions
          .map((item) => `${item.months} taksit: ${item.monthlyAmountText}`)
          .join("\n"),
      },
    ],
    installmentOptions,
    baseAttributes: toAttributeList(apiProduct.attributes),
  }
}
