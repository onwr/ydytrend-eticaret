/**
 * Prisma'nın döndürdüğü Decimal nesnelerini Client Component'lerin anlayabileceği
 * düz nesnelere (number veya string) dönüştürür.
 * Next.js Server Components -> Client Components geçişindeki "Only plain objects can be passed"
 * hatasını çözer.
 */

type PrismaDecimalLike = { constructor: { name: string }; d?: unknown; s?: unknown; e?: unknown; toString(): string }

export function serializePrisma(data: unknown): unknown {
  if (data === null || data === undefined) return data ?? null

  // Array ise her elemanı gez
  if (Array.isArray(data)) {
    return data.map(item => serializePrisma(item))
  }

  // Obje ise içini gez
  if (typeof data === "object") {
    const obj = data as PrismaDecimalLike
    // Prisma Decimal kontrolü
    if (obj.constructor && (
      obj.constructor.name === "Decimal" ||
      obj.constructor.name === "Decimal2" ||
      (obj.d && obj.s && obj.e !== undefined)
    )) {
      return Number(obj.toString())
    }

    if (data instanceof Date) {
      return data.toISOString()
    }

    const newObj: Record<string, unknown> = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObj[key] = serializePrisma((data as Record<string, unknown>)[key])
      }
    }
    return newObj
  }

  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return data
  }

  return null
}
