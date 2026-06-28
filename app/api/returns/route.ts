import { NextResponse } from "next/server"
import { after } from "next/server"
import {
  ReturnRequestType,
} from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookies } from "@/lib/authSession"
import {
  canCustomerReturnOrder,
} from "@/lib/orderStatusTransitions"
import {
  getReturnPolicySettings,
  isWithinReturnWindow,
} from "@/lib/returnPolicySettings"
import {
  getOpenReturnQuantityByOrderItem,
  validateReturnItemQuantity,
  RETURN_REASONS,
} from "@/lib/returnEligibility"
import { generateReturnRequestNumber } from "@/lib/returnRequestNumber"
import { afterSalesEmailContent } from "@/lib/emails/afterSalesEmails"
import { dispatchTransactionalEmail } from "@/lib/email/dispatch"
import { getClientIp } from "@/lib/getClientIp"
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit"
import { jsonRateLimited } from "@/lib/apiError"

type ItemInput = {
  orderItemId: number
  quantity: number
  reason?: string
  requestedVariantId?: number
}

type Body = {
  orderNo?: string
  type?: "RETURN" | "EXCHANGE"
  reason?: string
  customerNote?: string
  packageOpened?: boolean
  productUsed?: boolean
  resolution?: "REFUND" | "EXCHANGE" | "STORE_CREDIT"
  items?: ItemInput[]
}

export async function GET() {
  try {
    const userId = await getUserIdFromCookies()
    if (!userId) {
      return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 })
    }

    const requests = await prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderNo: true } },
        items: { include: { orderItem: { select: { name: true } } } },
      },
    })

    return NextResponse.json({ items: requests })
  } catch (error) {
    console.error("Returns list error:", error)
    return NextResponse.json({ message: "Talepler yüklenemedi." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromCookies()
    if (!userId) {
      return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 })
    }

    const ip = getClientIp(request)
    const rl = await consumeRateLimit(
      `return:${userId}:${ip}`,
      RATE_LIMITS.returnCreate.max,
      RATE_LIMITS.returnCreate.windowMs
    )
    if (!rl.allowed) {
      return jsonRateLimited(rl.retryAfterSeconds ?? 3600)
    }

    const body = (await request.json()) as Body
    const orderNo = body.orderNo?.trim()
    const type =
      body.type === "EXCHANGE" ? ReturnRequestType.EXCHANGE : ReturnRequestType.RETURN

    if (!orderNo) {
      return NextResponse.json({ message: "Sipariş numarası gerekli." }, { status: 400 })
    }

    const reason = body.reason?.trim()
    if (!reason || !RETURN_REASONS.includes(reason as (typeof RETURN_REASONS)[number])) {
      return NextResponse.json({ message: "Geçerli bir neden seçin." }, { status: 400 })
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ message: "En az bir ürün seçin." }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNo, userId },
      include: {
        items: true,
        shipment: true,
        returnRequests: {
          include: { items: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    if (!canCustomerReturnOrder(order.status)) {
      return NextResponse.json(
        { message: "Bu sipariş için iade/değişim talebi oluşturulamaz." },
        { status: 400 }
      )
    }

    const policy = await getReturnPolicySettings(prisma)
    const windowDays =
      type === ReturnRequestType.EXCHANGE ? policy.exchangeWindowDays : policy.returnWindowDays
    const deliveredAt = order.shipment?.deliveredAt
    if (!isWithinReturnWindow(deliveredAt, windowDays)) {
      return NextResponse.json(
        { message: `İade/değişim süresi (${windowDays} gün) dolmuş.` },
        { status: 400 }
      )
    }

    const openQty = getOpenReturnQuantityByOrderItem(order.returnRequests)
    const orderItemMap = new Map(order.items.map((i) => [i.id, i]))

    for (const row of body.items) {
      const oi = orderItemMap.get(row.orderItemId)
      if (!oi) {
        return NextResponse.json({ message: "Geçersiz sipariş kalemi." }, { status: 400 })
      }
      const check = validateReturnItemQuantity(
        oi,
        row.quantity,
        openQty.get(row.orderItemId) ?? 0
      )
      if (!check.ok) {
        return NextResponse.json({ message: check.message }, { status: 400 })
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const requestNumber = await generateReturnRequestNumber(tx)
      const req = await tx.returnRequest.create({
        data: {
          requestNumber,
          orderId: order.id,
          userId,
          type,
          reason,
          customerNote: body.customerNote?.trim() || null,
          packageOpened: body.packageOpened ?? null,
          productUsed: body.productUsed ?? null,
          refundStatus: type === ReturnRequestType.RETURN ? "PENDING" : "NOT_REQUIRED",
          items: {
            create: body.items!.map((row) => {
              const oi = orderItemMap.get(row.orderItemId)!
              return {
                orderItemId: row.orderItemId,
                quantity: row.quantity,
                reason: row.reason?.trim() || reason,
                requestedVariantId: row.requestedVariantId ?? null,
                requestedVariantSnapshotJson: oi.variantSnapshotJson,
                resolution:
                  body.resolution ??
                  (type === ReturnRequestType.EXCHANGE ? "EXCHANGE" : "REFUND"),
              }
            }),
          },
        },
        include: { items: true },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: order.status,
          source: "CUSTOMER",
          changedByUserId: userId,
          note: `${type === ReturnRequestType.EXCHANGE ? "Değişim" : "İade"} talebi: ${requestNumber}`,
        },
      })

      return req
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    if (user?.email) {
      const event =
        type === ReturnRequestType.EXCHANGE ? "exchange_received" : "return_received"
      after(async () => {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
          const content = afterSalesEmailContent({
            siteUrl,
            event,
            orderNo: orderNo!,
            requestNumber: created.requestNumber,
            customerNote: body.customerNote?.trim() || null,
          })
          await dispatchTransactionalEmail(prisma, {
            type: event,
            to: user.email,
            idempotencyKey: `${event}:${created.requestNumber}`,
            payload: {
              subject: content.subject,
              text: content.text,
              html: content.html,
            },
          })
        } catch (e) {
          console.error("Return create email error:", e)
        }
      })
    }

    return NextResponse.json({
      message: "Talebiniz alındı.",
      requestNumber: created.requestNumber,
    })
  } catch (error) {
    console.error("Return create error:", error)
    return NextResponse.json({ message: "Talep oluşturulamadı." }, { status: 500 })
  }
}
