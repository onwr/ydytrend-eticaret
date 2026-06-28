import { NextResponse } from "next/server"
import { after } from "next/server"
import { OrderStatus, PaymentStatus } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookies } from "@/lib/authSession"
import {
  canCustomerCancelOrder,
  validateOrderStatusTransition,
} from "@/lib/orderStatusTransitions"
import { restoreOrderStock, recordOrderStatusChange } from "@/lib/orderStockRestore"
import { CANCEL_REASONS } from "@/lib/returnEligibility"
import { afterSalesEmailContent } from "@/lib/emails/afterSalesEmails"
import { dispatchTransactionalEmail } from "@/lib/email/dispatch"
import { getClientIp } from "@/lib/getClientIp"
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit"
import { jsonRateLimited } from "@/lib/apiError"

type Body = {
  reason?: string
  note?: string
  confirm?: boolean
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const userId = await getUserIdFromCookies()
    if (!userId) {
      return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 })
    }

    const ip = getClientIp(request)
    const rl = await consumeRateLimit(
      `cancel:${userId}:${ip}`,
      RATE_LIMITS.orderCancel.max,
      RATE_LIMITS.orderCancel.windowMs
    )
    if (!rl.allowed) {
      return jsonRateLimited(rl.retryAfterSeconds ?? 3600)
    }

    const { orderNo } = await params
    const body = (await request.json()) as Body

    if (!body.confirm) {
      return NextResponse.json({ message: "İptal onayı gerekli." }, { status: 400 })
    }

    const reason = body.reason?.trim()
    if (!reason || !CANCEL_REASONS.includes(reason as (typeof CANCEL_REASONS)[number])) {
      return NextResponse.json({ message: "Geçerli bir iptal nedeni seçin." }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNo, userId },
      include: { payments: { orderBy: { id: "desc" }, take: 1 } },
    })

    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json({ message: "Sipariş zaten iptal edilmiş." }, { status: 400 })
    }

    if (!canCustomerCancelOrder(order.status)) {
      return NextResponse.json(
        { message: "Bu sipariş artık iptal edilemez." },
        { status: 400 }
      )
    }

    const check = validateOrderStatusTransition(order.status, OrderStatus.CANCELLED)
    if (!check.ok) {
      return NextResponse.json({ message: check.message }, { status: 400 })
    }

    const note = [reason, body.note?.trim()].filter(Boolean).join(" — ")

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          note: order.note ? `${order.note}\n[İptal] ${note}` : `[İptal] ${note}`,
        },
      })
      await recordOrderStatusChange(tx, {
        orderId: order.id,
        previousStatus: order.status,
        newStatus: OrderStatus.CANCELLED,
        source: "CUSTOMER",
        changedByUserId: userId,
        note,
      })
      await restoreOrderStock(tx, order.id, { source: "CUSTOMER_CANCEL" })
      const payment = order.payments[0]
      if (payment && payment.status === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        })
      }
    })

    const email = order.userId
      ? (
          await prisma.user.findUnique({
            where: { id: order.userId },
            select: { email: true },
          })
        )?.email
      : order.guestEmail

    if (email) {
      after(async () => {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
          const payment = order.payments[0]
          const isBankTransferPending =
            payment?.method === "BANK_TRANSFER" && payment.status === "PAID"
          const content = isBankTransferPending
            ? afterSalesEmailContent({
                siteUrl,
                event: "cancel_manual_refund_pending",
                orderNo,
              })
            : afterSalesEmailContent({
                siteUrl,
                event: "order_cancelled",
                orderNo,
              })
          const eventKey = isBankTransferPending ? "cancel_manual_refund_pending" : "order_cancelled"
          await dispatchTransactionalEmail(prisma, {
            type: eventKey,
            to: email,
            idempotencyKey: `${eventKey}:${orderNo}`,
            payload: {
              subject: content.subject,
              text: content.text,
              html: content.html,
            },
          })
        } catch (e) {
          console.error("Cancel email error:", e)
        }
      })
    }

    return NextResponse.json({ message: "Siparişiniz iptal edildi." })
  } catch (error) {
    console.error("Order cancel error:", error)
    return NextResponse.json({ message: "İptal işlemi tamamlanamadı." }, { status: 500 })
  }
}
