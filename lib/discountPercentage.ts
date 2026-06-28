export function computeDiscountPercentage(
  compareAtPrice: number | null | undefined,
  salePrice: number | null | undefined
): number {
  if (compareAtPrice == null || salePrice == null) return 0
  const compare = Number(compareAtPrice)
  const sale = Number(salePrice)
  if (!Number.isFinite(compare) || !Number.isFinite(sale)) return 0
  if (compare <= 0 || sale <= 0 || sale >= compare) return 0
  const pct = ((compare - sale) / compare) * 100
  return Math.round(pct * 100) / 100
}

export function computeProductDiscountFromPrices(
  basePrice: number,
  compareAtPrice: number | null | undefined
): number {
  return computeDiscountPercentage(compareAtPrice, basePrice)
}
