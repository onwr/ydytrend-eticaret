import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPaytrToken } from "@/lib/paytr"
import { getClientIp } from "@/lib/checkoutRateLimit"
import { toNumber } from "@/lib/cart"

export async function POST(req: Request) {
  try {
    const { orderNo } = await req.json() as { orderNo?: string }
    if (!orderNo) {
      return NextResponse.json({ message: "orderNo gerekli." }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    const payment = order.payments[0]
    if (!payment || payment.method !== "CARD") {
      return NextResponse.json({ message: "Bu sipariş kredi kartı ödemesi için değil." }, { status: 400 })
    }

    const userIp = getClientIp(req)

    const userBasket: [string, string, number][] = order.items.map((item) => [
      item.name,
      toNumber(item.unitPrice).toFixed(2),
      item.quantity,
    ])

    const { token } = await getPaytrToken({
      merchantOid: order.orderNo,
      email: order.guestEmail ?? "",
      paymentAmount: Math.round(toNumber(order.grandTotal) * 100),
      userBasket,
      userName: order.shippingFullName,
      userAddress: `${order.shippingLine1}, ${order.shippingDistrict}, ${order.shippingCity}`,
      userPhone: order.shippingPhone ?? order.guestPhone ?? "",
      userIp,
    })

    return NextResponse.json({ token })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token alınamadı."
    console.error("[paytr-token]", message)
    return NextResponse.json({ message }, { status: 500 })
  }
}
