import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookies } from "@/lib/authSession"
import { buildOrderTimeline } from "@/lib/orderTimeline"
import { getReturnPolicySettings, isWithinReturnWindow } from "@/lib/returnPolicySettings"
import { canCustomerCancelOrder, canCustomerReturnOrder } from "@/lib/orderStatusTransitions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const userId = await getUserIdFromCookies()
    const { orderNo } = await params

    if (!userId) {
      return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNo, userId },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1 } } },
          },
        },
        shipment: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        returnRequests: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    const policy = await getReturnPolicySettings(prisma)
    const timeline = buildOrderTimeline({
      status: order.status,
      createdAt: order.createdAt,
      history: order.statusHistory,
      shipment: order.shipment,
    })

    const canCancel = canCustomerCancelOrder(order.status)
    const canReturn =
      canCustomerReturnOrder(order.status) &&
      isWithinReturnWindow(order.shipment?.deliveredAt, policy.returnWindowDays)
    const canExchange =
      canCustomerReturnOrder(order.status) &&
      isWithinReturnWindow(order.shipment?.deliveredAt, policy.exchangeWindowDays)

    return NextResponse.json({
      order,
      timeline,
      actions: {
        canCancel,
        canReturn,
        canExchange,
        returnWindowDays: policy.returnWindowDays,
        exchangeWindowDays: policy.exchangeWindowDays,
      },
    })
  } catch (error) {
    console.error("GET Order Detail Error:", error)
    return NextResponse.json({ message: "Sipariş detayları getirilirken hata oluştu." }, { status: 500 })
  }
}
