/**
 * Varyant kombinasyon üretici — saf yardımcı fonksiyonlar.
 *
 * Hiçbir DB çağrısı yapmaz; sadece veri dönüşümü.
 */

import { generateCombinationKey } from "@/lib/variantAttributes"

export type AttrValueOption = {
  attributeId: number
  attributeName: string
  attributeType: string
  valueId: number
  value: string
  colorHex?: string | null
}

export type AttributeAxis = {
  attributeId: number
  attributeName: string
  attributeType: string
  values: Omit<AttrValueOption, "attributeId" | "attributeName" | "attributeType">[]
}

export type CombinationPair = { attributeId: number; valueId: number }

export type GeneratedCombination = {
  combinationKey: string
  pairs: CombinationPair[]
  label: string
}

export type ExistingVariant = {
  id: number | string
  combinationKey?: string | null
  name?: string
  sku?: string
  price?: string | number
  compareAtPrice?: string | number | null
  stock?: string | number
  lowStockThreshold?: string | number
  isActive?: boolean
  attributeValues?: CombinationPair[]
}

export type MergedVariant = {
  id: number | string
  name: string
  sku: string
  price: string
  compareAtPrice: string
  stock: string
  lowStockThreshold: string
  isActive: boolean
  combinationKey: string | null
  attributeValues: CombinationPair[]
  isNew: boolean
}

const MAX_COMBINATIONS = 100

/** Kartezyen çarpım: [[A,B],[1,2]] → [[A,1],[A,2],[B,1],[B,2]] */
function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]]
  const [first, ...rest] = arrays
  const restProduct = cartesian(rest)
  return first.flatMap((item) => restProduct.map((combo) => [item, ...combo]))
}

/**
 * Seçilen attribute eksenlerinden tüm kombinasyonları üretir.
 *
 * @param axes Her eksen bir attribute ve seçilen value listesini içerir.
 * @returns Maksimum 100 kombinasyon. Limit aşılırsa `limitExceeded: true`.
 */
export function generateVariantCombinations(axes: AttributeAxis[]): {
  combinations: GeneratedCombination[]
  limitExceeded: boolean
} {
  const filteredAxes = axes.filter((ax) => ax.values.length > 0)
  if (filteredAxes.length === 0) return { combinations: [], limitExceeded: false }

  const valueArrays = filteredAxes.map((ax) =>
    ax.values.map((v) => ({
      attributeId: ax.attributeId,
      attributeName: ax.attributeName,
      valueId: v.valueId,
      value: v.value,
    }))
  )

  const product = cartesian(valueArrays)

  const limitExceeded = product.length > MAX_COMBINATIONS
  const sliced = limitExceeded ? product.slice(0, MAX_COMBINATIONS) : product

  const combinations: GeneratedCombination[] = sliced.map((combo) => {
    const pairs: CombinationPair[] = combo.map((item) => ({
      attributeId: item.attributeId,
      valueId: item.valueId,
    }))
    const key = generateCombinationKey(pairs) ?? ""
    const label = combo.map((item) => item.value).join(" / ")
    return { combinationKey: key, pairs, label }
  })

  return { combinations, limitExceeded }
}

/**
 * Yeni üretilen kombinasyonları mevcut varyantlarla birleştirir.
 *
 * - Eşleşen combinationKey varsa: mevcut varyantın id/sku/price/stock değerleri korunur.
 * - Eşleşen yoksa: yeni olarak işaretlenir.
 * - Mevcut varyantlar yeni listede yoksa: `isActive: false` yapılır.
 */
export function mergeVariantCombinationsWithExisting(
  generated: GeneratedCombination[],
  existing: ExistingVariant[],
  fallbackPrice: string = "0",
  skuPrefix: string = "VAR"
): MergedVariant[] {
  const existingByKey = new Map<string, ExistingVariant>()
  for (const v of existing) {
    if (v.combinationKey) existingByKey.set(v.combinationKey, v)
  }

  const generatedKeys = new Set(generated.map((g) => g.combinationKey))

  const merged: MergedVariant[] = generated.map((combo) => {
    const found = existingByKey.get(combo.combinationKey)
    if (found) {
      return {
        id: found.id,
        name: found.name ?? combo.label,
        sku: found.sku ?? `${skuPrefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        price: String(found.price ?? fallbackPrice),
        compareAtPrice: String(found.compareAtPrice ?? ""),
        stock: String(found.stock ?? 0),
        lowStockThreshold: String(found.lowStockThreshold ?? 5),
        isActive: found.isActive !== false,
        combinationKey: combo.combinationKey,
        attributeValues: combo.pairs,
        isNew: false,
      }
    }
    return {
      id: `new-${combo.combinationKey}`,
      name: combo.label,
      sku: `${skuPrefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      price: fallbackPrice,
      compareAtPrice: "",
      stock: "0",
      lowStockThreshold: "5",
      isActive: true,
      combinationKey: combo.combinationKey,
      attributeValues: combo.pairs,
      isNew: true,
    }
  })

  // Yeni listede olmayan mevcut varyantları pasif ekle (soft-delete için görünür tut)
  for (const v of existing) {
    if (v.combinationKey && !generatedKeys.has(v.combinationKey)) {
      merged.push({
        id: v.id,
        name: v.name ?? "Pasif Varyant",
        sku: v.sku ?? "",
        price: String(v.price ?? fallbackPrice),
        compareAtPrice: String(v.compareAtPrice ?? ""),
        stock: String(v.stock ?? 0),
        lowStockThreshold: String(v.lowStockThreshold ?? 5),
        isActive: false,
        combinationKey: v.combinationKey,
        attributeValues: v.attributeValues ?? [],
        isNew: false,
      })
    }
  }

  return merged
}

/** combinationKey'den label üret (attribute map olmadan basit görüntüleme için) */
export function createVariantCombinationKey(
  pairs: CombinationPair[]
): string | null {
  return generateCombinationKey(pairs)
}
