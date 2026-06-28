import { OrderStatus } from "@/generated/prisma/client"
import { ORDER_STATUS_LABELS } from "@/lib/orderStatusLabels"

export { ORDER_STATUS_LABELS, orderStatusLabel } from "@/lib/orderStatusLabels"

export const CUSTOMER_CANCELLABLE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
])

const ALLOWED_TRANSITIONS: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  [OrderStatus.PENDING]: new Set([
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
  ]),
  [OrderStatus.PAID]: new Set([
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ]),
  [OrderStatus.PROCESSING]: new Set([
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ]),
  [OrderStatus.SHIPPED]: new Set([OrderStatus.DELIVERED, OrderStatus.REFUNDED]),
  [OrderStatus.DELIVERED]: new Set([OrderStatus.REFUNDED]),
  [OrderStatus.CANCELLED]: new Set(),
  [OrderStatus.REFUNDED]: new Set(),
}

export function getAllowedOrderTransitions(from: OrderStatus): OrderStatus[] {
  return Array.from(ALLOWED_TRANSITIONS[from] ?? [])
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true
  return ALLOWED_TRANSITIONS[from]?.has(to) ?? false
}

export function validateOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus
): { ok: true } | { ok: false; message: string } {
  if (from === to) return { ok: true }
  if (!canTransitionOrderStatus(from, to)) {
    return {
      ok: false,
      message: `${ORDER_STATUS_LABELS[from]} durumundan ${ORDER_STATUS_LABELS[to]} durumuna geçilemez.`,
    }
  }
  return { ok: true }
}

export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return CUSTOMER_CANCELLABLE_STATUSES.has(status)
}

export function canCustomerReturnOrder(status: OrderStatus): boolean {
  return status === OrderStatus.DELIVERED
}
