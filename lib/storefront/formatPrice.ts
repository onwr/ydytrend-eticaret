import { BRAND_CURRENCY_SYMBOL } from "@/lib/brand"

export type FormattedPrice = {
  current: string
  old: string | null
  discountPct: number
  hasDiscount: boolean
}

export function formatPriceValue(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPriceWithSymbol(value: number): string {
  return `${BRAND_CURRENCY_SYMBOL}${formatPriceValue(value)}`
}

export function resolveProductCardPrice(
  basePrice: number,
  compareAtPrice: number | null | undefined
): FormattedPrice {
  const base = Number(basePrice)
  const compare =
    compareAtPrice !== null && compareAtPrice !== undefined && !Number.isNaN(Number(compareAtPrice))
      ? Number(compareAtPrice)
      : null
  const hasDiscount = compare !== null && compare > 0 && compare < base
  const current = hasDiscount ? compare : base
  const old = hasDiscount ? base : null
  const discountPct = hasDiscount ? Math.round(((base - compare) / base) * 100) : 0
  return {
    current: formatPriceValue(current),
    old: old !== null ? formatPriceValue(old) : null,
    discountPct,
    hasDiscount,
  }
}
