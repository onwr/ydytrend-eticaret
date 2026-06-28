import type { Prisma } from "@/generated/prisma/client"
import {
  ReturnItemCondition,
  ReturnRequestType,
  StockMovementType,
} from "@/generated/prisma/client"

type Tx = Prisma.TransactionClient

export type ReturnStockItem = {
  id: number
  quantity: number
  condition: ReturnItemCondition | null
  requestedVariantId: number | null
  orderItem: {
    productId: number
    variantId: number | null
  }
}

/** İade/değişim tamamlanırken stok giriş/çıkışı — idempotent (`stockRestoredAt`). */
export async function processReturnStockOnComplete(
  tx: Tx,
  params: {
    returnRequestId: number
    orderId: number
    type: ReturnRequestType
    requestNumber: string
    stockRestoredAt: Date | null
    items: ReturnStockItem[]
  }
): Promise<{ processed: boolean }> {
  if (params.stockRestoredAt) {
    return { processed: false }
  }

  for (const item of params.items) {
    const condition = item.condition ?? ReturnItemCondition.NEEDS_INSPECTION
    if (condition !== ReturnItemCondition.SELLABLE) continue
    if (!item.orderItem.variantId) continue

    await tx.productVariant.update({
      where: { id: item.orderItem.variantId },
      data: { stock: { increment: item.quantity } },
    })

    const movementType =
      params.type === ReturnRequestType.EXCHANGE
        ? StockMovementType.EXCHANGE_IN
        : StockMovementType.RETURN

    await tx.stockMovement.create({
      data: {
        productId: item.orderItem.productId,
        variantId: item.orderItem.variantId,
        orderId: params.orderId,
        type: movementType,
        quantity: item.quantity,
        source: "RETURN_COMPLETE",
        note: `return:${params.requestNumber}:item:${item.id}`,
        salesChannel: "ONLINE",
      },
    })
  }

  if (params.type === ReturnRequestType.EXCHANGE) {
    for (const item of params.items) {
      if (!item.requestedVariantId) {
        throw new Error("Değişim kaleminde hedef varyant eksik.")
      }
      const variant = await tx.productVariant.findUnique({
        where: { id: item.requestedVariantId },
        select: { id: true, stock: true, productId: true, isActive: true },
      })
      if (!variant?.isActive) {
        throw new Error("Değişim varyantı geçersiz veya pasif.")
      }
      if (variant.stock < item.quantity) {
        throw new Error("Değişim için yetersiz stok.")
      }
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: { decrement: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: variant.productId,
          variantId: variant.id,
          orderId: params.orderId,
          type: StockMovementType.EXCHANGE_OUT,
          quantity: item.quantity,
          source: "RETURN_COMPLETE",
          note: `return:${params.requestNumber}:exchange:out:item:${item.id}`,
          salesChannel: "ONLINE",
        },
      })
    }
  }

  await tx.returnRequest.update({
    where: { id: params.returnRequestId },
    data: { stockRestoredAt: new Date() },
  })

  return { processed: true }
}
