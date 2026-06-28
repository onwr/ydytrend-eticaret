import type { OrderItem, ReturnRequest, ReturnRequestStatus } from "@/generated/prisma/client"

const OPEN_RETURN_STATUSES: ReadonlySet<ReturnRequestStatus> = new Set([
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "WAITING_FOR_PRODUCT",
  "PRODUCT_RECEIVED",
])

export function getOpenReturnQuantityByOrderItem(
  requests: Array<Pick<ReturnRequest, "status"> & { items: Array<{ orderItemId: number; quantity: number }> }>
): Map<number, number> {
  const map = new Map<number, number>()
  for (const req of requests) {
    if (!OPEN_RETURN_STATUSES.has(req.status)) continue
    for (const item of req.items) {
      map.set(item.orderItemId, (map.get(item.orderItemId) ?? 0) + item.quantity)
    }
  }
  return map
}

export function validateReturnItemQuantity(
  orderItem: Pick<OrderItem, "id" | "quantity">,
  requestedQty: number,
  alreadyOpenQty: number
): { ok: true } | { ok: false; message: string } {
  if (!Number.isInteger(requestedQty) || requestedQty < 1) {
    return { ok: false, message: "Geçersiz adet." }
  }
  const max = orderItem.quantity - alreadyOpenQty
  if (requestedQty > max) {
    return { ok: false, message: `Bu kalem için en fazla ${max} adet talep edilebilir.` }
  }
  return { ok: true }
}

export const CANCEL_REASONS = [
  "Yanlış ürün seçtim",
  "Adres bilgilerim hatalı",
  "Ödeme yapmayacağım",
  "Fikrimi değiştirdim",
  "Başka",
] as const

export const RETURN_REASONS = [
  "Ürün beklediğim gibi değil",
  "Hasarlı geldi",
  "Yanlış ürün gönderildi",
  "Beden/ölçü uygun değil",
  "Renk farklı",
  "Eksik ürün",
  "Diğer",
] as const
