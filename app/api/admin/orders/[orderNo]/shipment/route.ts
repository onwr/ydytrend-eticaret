import { NextResponse } from "next/server"
import { after } from "next/server"
import { OrderStatus } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { validateTrackingUrl } from "@/lib/trackingUrlValidation"
import { validateOrderStatusTransition } from "@/lib/orderStatusTransitions"
import { recordOrderStatusChange } from "@/lib/orderStockRestore"
import {
  AdminActivityAction,
  logAdminActivity,
} from "@/lib/adminActivityLog"
import { afterSalesEmailContent } from "@/lib/emails/afterSalesEmails"
import { dispatchTransactionalEmail } from "@/lib/email/dispatch"

type Body = {
  cargoCompany?: string
  trackingNo?: string
  trackingUrl?: string
  estimatedDeliveryDate?: string
  shippedAt?: string
  deliveredAt?: string
  markShipped?: boolean
  markDelivered?: boolean
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const { orderNo } = await params
    const body = (await request.json()) as Body

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { shipment: true },
    })
    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    let trackingUrl: string | null | undefined = body.trackingUrl?.trim() || null
    if (trackingUrl) {
      const v = validateTrackingUrl(trackingUrl)
      if (!v.ok) return NextResponse.json({ message: v.message }, { status: 400 })
      trackingUrl = v.url
    }

    const shipmentData = {
      cargoCompany: body.cargoCompany?.trim() || order.shipment?.cargoCompany || null,
      trackingNo: body.trackingNo?.trim() || order.shipment?.trackingNo || null,
      trackingUrl: trackingUrl ?? order.shipment?.trackingUrl ?? null,
      estimatedDeliveryDate: body.estimatedDeliveryDate
        ? new Date(body.estimatedDeliveryDate)
        : order.shipment?.estimatedDeliveryDate ?? null,
      shippedAt: body.shippedAt
        ? new Date(body.shippedAt)
        : body.markShipped
          ? new Date()
          : order.shipment?.shippedAt ?? null,
      deliveredAt: body.deliveredAt
        ? new Date(body.deliveredAt)
        : body.markDelivered
          ? new Date()
          : order.shipment?.deliveredAt ?? null,
    }

    await prisma.$transaction(async (tx) => {
      await tx.shipment.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id, ...shipmentData },
        update: shipmentData,
      })

      let nextStatus = order.status
      if (body.markDelivered && order.status !== OrderStatus.DELIVERED) {
        const check = validateOrderStatusTransition(order.status, OrderStatus.DELIVERED)
        if (!check.ok) throw new Error(check.message)
        nextStatus = OrderStatus.DELIVERED
      } else if (body.markShipped && order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
        const check = validateOrderStatusTransition(order.status, OrderStatus.SHIPPED)
        if (!check.ok) throw new Error(check.message)
        nextStatus = OrderStatus.SHIPPED
      }

      if (nextStatus !== order.status) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: nextStatus },
        })
        await recordOrderStatusChange(tx, {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: nextStatus,
          source: "ADMIN",
          changedByUserId: session.userId,
          note: "Kargo bilgisi güncellendi",
        })
      }
    })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.ORDER_SHIPMENT_UPDATE,
      resourceType: "Order",
      resourceId: orderNo,
      metadata: { trackingNo: shipmentData.trackingNo },
      request,
    })

    const updated = await prisma.order.findUnique({
      where: { orderNo },
      include: { shipment: true, user: { select: { email: true } } },
    })

    const email =
      updated?.user?.email ?? updated?.guestEmail ?? null
    if (email && (body.markShipped || body.markDelivered)) {
      const event = body.markDelivered ? "order_delivered" : "order_shipped"
      after(async () => {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
          const content = afterSalesEmailContent({
            siteUrl,
            event,
            orderNo,
            trackingNo: shipmentData.trackingNo ?? undefined,
            trackingUrl: shipmentData.trackingUrl ?? undefined,
          })
          await dispatchTransactionalEmail(prisma, {
            type: event,
            to: email,
            idempotencyKey: `${event}:${orderNo}`,
            payload: {
              subject: content.subject,
              text: content.text,
              html: content.html,
            },
          })
        } catch (e) {
          console.error("Shipment email error:", e)
        }
      })
    }

    return NextResponse.json({ message: "Kargo bilgisi güncellendi.", shipment: updated?.shipment })
  } catch (error) {
    console.error("Shipment update error:", error)
    const msg = error instanceof Error ? error.message : "Güncellenemedi."
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
