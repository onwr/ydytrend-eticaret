"use client"

import { useEffect, useRef } from "react"
import { trackAnalyticsEventSafe, cartLinesToAnalyticsItems } from "@/lib/analytics/trackSafe"
import { shouldSendPurchaseEvent } from "@/lib/analytics/purchaseDedupe"

type OrderPayload = {
  order: {
    orderNo: string
    status: string
    grandTotal: number | string
    items: Array<{
      productId: number
      name: string
      unitPrice: number | string
      quantity: number
    }>
  }
}

export function CheckoutSuccessAnalytics({ orderNo }: { orderNo: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (!orderNo || fired.current) return
    fired.current = true

    void (async () => {
      try {
        if (!shouldSendPurchaseEvent(orderNo)) return
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNo)}`, {
          credentials: "same-origin",
          cache: "no-store",
        })
        if (!res.ok) return
        const json = (await res.json()) as OrderPayload
        if (json.order.status === "CANCELLED") return

        trackAnalyticsEventSafe("purchase", {
          currency: "TRY",
          value: Number(json.order.grandTotal),
          transaction_id: orderNo,
          items: cartLinesToAnalyticsItems(
            json.order.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              unitPrice: Number(item.unitPrice),
              quantity: item.quantity,
            }))
          ),
        })
      } catch {
        /* analytics must not break success page */
      }
    })()
  }, [orderNo])

  return null
}
