/**
 * Admin: basePrice = liste fiyatı, compareAtPrice = indirimli satış fiyatı (daha düşük).
 */
export type ResolvedPrice = {
  sellPrice: number
  listPrice: number | null
  hasDiscount: boolean
  discountPct?: number
}

export function resolveSellPrice(
  basePrice: number,
  compareAtPrice: number | null | undefined
): ResolvedPrice {
  const base = Number(basePrice)
  const compare =
    compareAtPrice !== null && compareAtPrice !== undefined && !Number.isNaN(Number(compareAtPrice))
      ? Number(compareAtPrice)
      : null

  const hasDiscount = compare !== null && compare < base
  const sellPrice = hasDiscount ? compare : base
  const listPrice = hasDiscount ? base : null
  const discountPct = hasDiscount
    ? Math.round(((base - compare) / base) * 100)
    : undefined

  return { sellPrice, listPrice, hasDiscount, discountPct }
}

/** Varyantın kendi indirimi yoksa ürün indirim oranını varyant fiyatına uygular. */
export function resolveVariantSellPrice(
  variantBase: number,
  variantCompare: number | null | undefined,
  productBase: number,
  productCompare: number | null | undefined
): ResolvedPrice {
  const own = resolveSellPrice(variantBase, variantCompare)
  if (own.hasDiscount) return own

  const productPricing = resolveSellPrice(productBase, productCompare)
  if (!productPricing.hasDiscount || productBase <= 0) {
    return resolveSellPrice(variantBase, null)
  }

  const ratio = productPricing.sellPrice / productBase
  const sellPrice = Math.round(variantBase * ratio * 100) / 100
  return resolveSellPrice(variantBase, sellPrice)
}

export function resolveCartUnitPrice(
  productBase: number,
  productCompare: number | null | undefined,
  variantPrice: number | null | undefined,
  variantCompare: number | null | undefined
): number {
  if (variantPrice != null) {
    return resolveVariantSellPrice(
      Number(variantPrice),
      variantCompare,
      productBase,
      productCompare
    ).sellPrice
  }
  return resolveSellPrice(productBase, productCompare).sellPrice
}
