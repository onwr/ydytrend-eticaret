import type { Prisma, PrismaClient } from "@/generated/prisma/client"
import { OrderStatus, StockMovementType } from "@/generated/prisma/client"

type Tx = Prisma.TransactionClient

export async function restoreOrderStock(
  tx: Tx,
  orderId: number,
  opts?: { source?: string; movementType?: StockMovementType }
): Promise<{ restored: boolean; lines: number }> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, stockRestoredAt: true, items: true },
  })
  if (!order) return { restored: false, lines: 0 }
  if (order.stockRestoredAt) return { restored: false, lines: 0 }

  const source = opts?.source ?? "ORDER_CANCEL"
  const movementType = opts?.movementType ?? StockMovementType.CANCELLATION_RESTORE
  let lines = 0

  for (const item of order.items) {
    if (!item.variantId) continue
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    })
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        variantId: item.variantId,
        orderId,
        type: movementType,
        quantity: item.quantity,
        source,
        note: `orderId:${orderId}`,
        salesChannel: "ONLINE",
      },
    })
    lines += 1
  }

  await tx.order.update({
    where: { id: orderId },
    data: { stockRestoredAt: new Date() },
  })

  return { restored: true, lines }
}

export async function recordOrderStatusChange(
  tx: Tx,
  params: {
    orderId: number
    previousStatus: OrderStatus | null
    newStatus: OrderStatus
    source: "CUSTOMER" | "ADMIN" | "SYSTEM"
    changedByUserId?: number | null
    note?: string | null
  }
): Promise<void> {
  await tx.orderStatusHistory.create({
    data: {
      orderId: params.orderId,
      previousStatus: params.previousStatus,
      newStatus: params.newStatus,
      source: params.source,
      changedByUserId: params.changedByUserId ?? null,
      note: params.note?.trim() || null,
    },
  })
}

export async function updateOrderStatusWithHistory(
  prisma: PrismaClient,
  params: {
    orderId: number
    from: OrderStatus
    to: OrderStatus
    source: "CUSTOMER" | "ADMIN" | "SYSTEM"
    changedByUserId?: number | null
    note?: string | null
    extraData?: Prisma.OrderUpdateInput
  }
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: params.orderId },
      data: {
        status: params.to,
        ...(params.to === OrderStatus.CANCELLED ? { cancelledAt: new Date() } : {}),
        ...params.extraData,
      },
    })
    await recordOrderStatusChange(tx, {
      orderId: params.orderId,
      previousStatus: params.from,
      newStatus: params.to,
      source: params.source,
      changedByUserId: params.changedByUserId,
      note: params.note,
    })
    return order
  })
}
