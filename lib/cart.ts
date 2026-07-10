import { resolveCartUnitPrice } from "@/lib/pricing"

type DecimalLike = number | string | { toNumber?: () => number; toString: () => string }

export type CartLineAttribute = {
  name: string
  slug: string
  type: string
  value: string
  colorHex?: string | null
}

export type CartLine = {
  itemId: number
  productId: number
  productSlug: string
  productName: string
  imageUrl: string
  variantId: number | null
  variantName: string
  variantSku: string | null
  selectedAttributes: CartLineAttribute[]
  unitPrice: number
  quantity: number
  lineTotal: number
  stock: number | null
}

export type CartSummary = {
  itemCount: number
  subtotal: number
  shipping: number
  grandTotal: number
  freeShippingThreshold: number
}

export type CartResponse = {
  cartId: number | null
  lines: CartLine[]
  summary: CartSummary
}

type CartItemRow = {
  id: number
  productId: number
  variantId: number | null
  quantity: number
  product: {
    id: number
    slug: string
    name: string
    basePrice: DecimalLike
    compareAtPrice?: DecimalLike | null
    images: { url: string }[]
  }
  variant: {
    id: number
    name: string
    sku?: string | null
    price: DecimalLike
    compareAtPrice?: DecimalLike | null
    stock: number
    attributeValues?: {
      attribute: { name: string; slug: string; type: string }
      value: { value: string; colorHex?: string | null }
    }[]
  } | null
}

export function toNumber(value: DecimalLike): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  if (value.toNumber) return value.toNumber()
  return Number(value.toString())
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function mapCartItemsToLines(rows: CartItemRow[]): CartLine[] {
  return rows.map((row) => {
    const unitPrice = resolveCartUnitPrice(
      toNumber(row.product.basePrice),
      row.product.compareAtPrice != null ? toNumber(row.product.compareAtPrice) : null,
      row.variant ? toNumber(row.variant.price) : null,
      row.variant?.compareAtPrice != null ? toNumber(row.variant.compareAtPrice) : null
    )
    const quantity = row.quantity
    const selectedAttributes: CartLineAttribute[] = (row.variant?.attributeValues ?? []).map((av) => ({
      name: av.attribute.name,
      slug: av.attribute.slug,
      type: av.attribute.type,
      value: av.value.value,
      colorHex: av.value.colorHex ?? null,
    }))

    return {
      itemId: row.id,
      productId: row.productId,
      productSlug: row.product.slug,
      productName: row.product.name,
      imageUrl: row.product.images[0]?.url ?? "/urunler/urun1.jpg",
      variantId: row.variantId,
      variantName: row.variant?.name ?? "Standart",
      variantSku: row.variant?.sku ?? null,
      selectedAttributes,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      stock: row.variant?.stock ?? null,
    }
  })
}

export function calculateCartSummary(lines: CartLine[], threshold: number = 750, cost: number = 49.9): CartSummary {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const shipping = subtotal >= threshold ? 0 : (subtotal === 0 ? 0 : cost)
  return {
    itemCount,
    subtotal,
    shipping,
    grandTotal: subtotal + shipping,
    freeShippingThreshold: threshold,
  }
}
