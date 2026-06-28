import type { OrderStatusHistory, OrderStatus, Shipment } from "@/generated/prisma/client"
import { ORDER_STATUS_LABELS } from "@/lib/orderStatusTransitions"

export type TimelineStep = {
  key: string
  label: string
  at: string | null
  done: boolean
  current: boolean
}

export function buildOrderTimeline(params: {
  status: OrderStatus
  createdAt: Date
  history: Pick<OrderStatusHistory, "newStatus" | "createdAt">[]
  shipment: Pick<
    Shipment,
    "shippedAt" | "deliveredAt" | "cargoCompany" | "trackingNo" | "trackingUrl"
  > | null
}): TimelineStep[] {
  const statusAt = (s: OrderStatus) =>
    params.history.find((h) => h.newStatus === s)?.createdAt?.toISOString() ??
    (params.status === s ? params.createdAt.toISOString() : null)

  const steps: TimelineStep[] = [
    {
      key: "placed",
      label: "Sipariş alındı",
      at: params.createdAt.toISOString(),
      done: true,
      current: params.status === "PENDING",
    },
    {
      key: "paid",
      label: "Ödeme onaylandı",
      at: statusAt("PAID"),
      done: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "REFUNDED"].includes(params.status),
      current: params.status === "PAID",
    },
    {
      key: "processing",
      label: "Hazırlanıyor",
      at: statusAt("PROCESSING"),
      done: ["PROCESSING", "SHIPPED", "DELIVERED", "REFUNDED"].includes(params.status),
      current: params.status === "PROCESSING",
    },
    {
      key: "shipped",
      label: "Kargoya verildi",
      at: params.shipment?.shippedAt?.toISOString() ?? statusAt("SHIPPED"),
      done: ["SHIPPED", "DELIVERED", "REFUNDED"].includes(params.status),
      current: params.status === "SHIPPED",
    },
    {
      key: "delivered",
      label: "Teslim edildi",
      at: params.shipment?.deliveredAt?.toISOString() ?? statusAt("DELIVERED"),
      done: params.status === "DELIVERED" || params.status === "REFUNDED",
      current: params.status === "DELIVERED",
    },
  ]

  if (params.status === "CANCELLED") {
    steps.push({
      key: "cancelled",
      label: ORDER_STATUS_LABELS.CANCELLED,
      at: statusAt("CANCELLED"),
      done: true,
      current: true,
    })
  }
  if (params.status === "REFUNDED") {
    steps.push({
      key: "refunded",
      label: ORDER_STATUS_LABELS.REFUNDED,
      at: statusAt("REFUNDED"),
      done: true,
      current: true,
    })
  }

  return steps
}
