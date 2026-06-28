import { NextResponse } from "next/server"
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { AdminActivityAction, logAdminActivity } from "@/lib/adminActivityLog"
import { validateBankTransferReject } from "@/lib/storefront/paymentReject"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const { orderNo } = await params
    const body = (await request.json()) as { action?: string; reason?: string }
    const action = body.action

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ message: "Geçersiz işlem." }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { payments: { orderBy: { id: "desc" }, take: 1 } },
    })

    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    const payment = order.payments[0]
    if (!payment || payment.method !== PaymentMethod.BANK_TRANSFER) {
      return NextResponse.json({ message: "Bu sipariş havale/EFT ödemesi değil." }, { status: 400 })
    }

    if (action === "approve") {
      if (payment.status === PaymentStatus.PAID) {
        return NextResponse.json({ message: "Ödeme zaten onaylanmış." }, { status: 400 })
      }
      if (!payment.receiptUrl) {
        return NextResponse.json(
          { message: "Müşteri henüz dekont yüklemedi." },
          { status: 400 }
        )
      }

      const now = new Date()
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.PAID, paidAt: now },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: order.status === OrderStatus.PENDING ? OrderStatus.PAID : order.status,
          },
        }),
      ])

      await logAdminActivity(prisma, session, {
        action: AdminActivityAction.PAYMENT_APPROVE,
        resourceType: "Order",
        resourceId: order.orderNo,
        metadata: { paymentId: payment.id },
        request,
      })

      return NextResponse.json({ message: "Havale/EFT ödemesi onaylandı." })
    }

    const rejectCheck = validateBankTransferReject({
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      receiptUrl: payment.receiptUrl,
      orderStatus: order.status,
    })
    if (!rejectCheck.ok) {
      return NextResponse.json({ message: rejectCheck.message }, { status: rejectCheck.status })
    }

    const reason = body.reason?.trim() || null

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: rejectCheck.nextPaymentStatus },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: rejectCheck.nextPaymentStatus,
          status: rejectCheck.nextOrderStatus,
        },
      }),
    ])

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.PAYMENT_REJECT,
      resourceType: "Order",
      resourceId: order.orderNo,
      metadata: { paymentId: payment.id, reason },
      request,
    })

    return NextResponse.json({ message: "Havale/EFT ödemesi reddedildi." })
  } catch (error) {
    console.error("Payment action error:", error)
    return NextResponse.json({ message: "Ödeme işlemi tamamlanamadı." }, { status: 500 })
  }
}
