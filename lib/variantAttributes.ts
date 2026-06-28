/**
 * Varyant özellik normalizer.
 *
 * Yeni ürünlerde ilişkisel `attributeValues` tercih edilir.
 * Eski JSON kayıtlarda `attributesJson` okunur; her iki kaynak da aynı tip çıktı döndürür.
 */

export type NormalizedAttribute = {
  attributeId: number | null
  valueId: number | null
  slug: string
  name: string
  value: string
  colorHex?: string | null
  type?: string | null
}

export type NormalizedAttributeMap = Record<string, NormalizedAttribute>

type RelationalAttrRow = {
  attribute: { id: number; name: string; slug: string; type: string }
  value: { id: number; value: string; slug: string; colorHex?: string | null }
}

/** Tek tip çıktı: slug → NormalizedAttribute */
export function normalizeVariantAttributes(
  relational: RelationalAttrRow[] | null | undefined,
  jsonStr: string | null | undefined
): NormalizedAttributeMap {
  // İlişkisel veri varsa onu kullan
  if (relational && relational.length > 0) {
    return Object.fromEntries(
      relational.map((row) => [
        row.attribute.slug,
        {
          attributeId: row.attribute.id,
          valueId: row.value.id,
          slug: row.attribute.slug,
          name: row.attribute.name,
          value: row.value.value,
          colorHex: row.value.colorHex ?? null,
          type: row.attribute.type,
        },
      ])
    )
  }

  // Eski JSON fallback: { "Renk": "Gold", "Beden": "M" }
  if (jsonStr) {
    try {
      const parsed: unknown = JSON.parse(jsonStr)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>)
            .filter(([, v]) => typeof v === "string")
            .map(([key, value]) => {
              const slug = key.toLowerCase().replace(/\s+/g, "-")
              return [
                slug,
                {
                  attributeId: null,
                  valueId: null,
                  slug,
                  name: key,
                  value: String(value),
                  colorHex: null,
                  type: null,
                },
              ]
            })
        )
      }
    } catch {
      // geçersiz JSON — boş dön
    }
  }

  return {}
}

/** `NormalizedAttributeMap` → `{ key, value }[]` (productDetailShape uyumlu) */
export function attributeMapToList(
  map: NormalizedAttributeMap
): { key: string; value: string }[] {
  return Object.values(map).map((attr) => ({ key: attr.name, value: attr.value }))
}

/** API yanıtındaki varyant verisini normalize et (productDetailShape.ApiVariant ile uyumlu) */
export function getVariantAttributeMap(variant: {
  attributeValues?: RelationalAttrRow[] | null
  attributesJson?: string | null
}): NormalizedAttributeMap {
  return normalizeVariantAttributes(variant.attributeValues, variant.attributesJson)
}

/**
 * Varyant kombinasyonu için deterministik anahtar üretir.
 * Format: "attributeId1:valueId1|attributeId2:valueId2" (attributeId'ye göre artan sıralı)
 *
 * Hiç attributeValues yoksa null döner (varyantsız ürün, unique constraint'ten muaf).
 */
export function generateCombinationKey(
  attributeValues: { attributeId: number; valueId: number }[]
): string | null {
  if (!attributeValues || attributeValues.length === 0) return null
  return attributeValues
    .slice()
    .sort((a, b) => a.attributeId - b.attributeId)
    .map((av) => `${av.attributeId}:${av.valueId}`)
    .join("|")
}
