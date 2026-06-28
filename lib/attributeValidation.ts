/**
 * Sunucu tarafı attribute değer doğrulama.
 *
 * Her { attributeId, valueId } çiftinin geçerli olduğunu doğrular:
 * - valueId gerçekten o attributeId'ye ait olmalı
 * - AttributeValue aktif olmalı
 *
 * Geçersiz çiftleri döner (boş dizi = tümü geçerli).
 */
import { prisma } from "@/lib/prisma"

export type AttrValueInput = { attributeId: number; valueId: number }

export async function validateAttributeValues(
  pairs: AttrValueInput[]
): Promise<{ valid: true } | { valid: false; message: string }> {
  if (!pairs || pairs.length === 0) return { valid: true }

  // Tüm valueId'leri bir seferde çek
  const valueIds = pairs.map((p) => p.valueId)
  const values = await prisma.attributeValue.findMany({
    where: { id: { in: valueIds }, isActive: true },
    select: { id: true, attributeId: true },
  })

  const valueMap = new Map(values.map((v) => [v.id, v.attributeId]))

  for (const pair of pairs) {
    const ownerAttrId = valueMap.get(pair.valueId)
    if (ownerAttrId === undefined) {
      return {
        valid: false,
        message: `AttributeValue #${pair.valueId} bulunamadı veya pasif.`,
      }
    }
    if (ownerAttrId !== pair.attributeId) {
      return {
        valid: false,
        message: `AttributeValue #${pair.valueId}, Attribute #${pair.attributeId}'e ait değil (gerçek attribute: #${ownerAttrId}).`,
      }
    }
  }

  return { valid: true }
}
