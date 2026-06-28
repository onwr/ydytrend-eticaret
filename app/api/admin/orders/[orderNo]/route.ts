import { NextResponse } from "next/server"
import { after } from "next/server"
import { OrderStatus } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { orderStatusEmailContent } from "@/lib/emails/orderStatus"
import { dispatchTransactionalEmail } from "@/lib/email/dispatch"
import {
  AdminActivityAction,
  logAdminActivity,
  sanitizeAdminActivityMetadata,
} from "@/lib/adminActivityLog"
import { getClientIp } from "@/lib/checkoutRateLimit"
import { validateOrderStatusTransition } from "@/lib/orderStatusTransitions"
import { recordOrderStatusChange } from "@/lib/orderStockRestore"
import { buildOrderDeletionSnapshot } from "@/lib/orderDeleteSnapshot"

const ORDER_STATUSES = new Set<string>(Object.values(OrderStatus))

function trunc(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + "…"
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const { orderNo } = await params
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
          },
        },
        payments: { orderBy: { id: "desc" } },
        shipment: true,
        user: { select: { id: true, email: true, name: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Admin order GET error:", error)
    return NextResponse.json({ message: "Sipariş yüklenemedi." }, { status: 500 })
  }
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
    const { status } = (await request.json()) as { status?: string }

    if (!status || !ORDER_STATUSES.has(status)) {
      return NextResponse.json({ message: "Geçersiz durum." }, { status: 400 })
    }

    const nextStatus = status as OrderStatus

    const existing = await prisma.order.findUnique({
      where: { orderNo },
      select: {
        orderNo: true,
        status: true,
        guestEmail: true,
        user: { select: { email: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    const transition = validateOrderStatusTransition(existing.status, nextStatus)
    if (!transition.ok) {
      return NextResponse.json({ message: transition.message }, { status: 400 })
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { orderNo },
        data: { status: nextStatus },
        select: { orderNo: true, status: true },
      })
      if (existing.status !== nextStatus) {
        await recordOrderStatusChange(tx, {
          orderId: (await tx.order.findUnique({ where: { orderNo }, select: { id: true } }))!.id,
          previousStatus: existing.status,
          newStatus: nextStatus,
          source: "ADMIN",
          changedByUserId: session.userId,
        })
      }
      return updated
    })

    const to =
      existing.user?.email?.trim() || existing.guestEmail?.trim() || null
    const siteUrlBase =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"

    if (to && existing.status !== nextStatus) {
      const no = order.orderNo
      const st = nextStatus
      after(() => {
        void (async () => {
          try {
            const { subject, text, html } = orderStatusEmailContent({
              siteUrl: siteUrlBase,
              orderNo: no,
              newStatus: st,
            })
            await dispatchTransactionalEmail(prisma, {
              type: "order_status",
              to,
              idempotencyKey: `order-status:${no}:${st}`,
              payload: { subject, text, html },
            })
          } catch (err) {
            console.error("order status email:", err)
          }
        })()
      })
    }

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.ORDER_STATUS_UPDATE,
      resourceType: "Order",
      resourceId: order.orderNo,
      metadata: {
        from: existing.status,
        to: nextStatus,
      },
      request,
    })
    return NextResponse.json({ message: "Sipariş durumu güncellendi.", order })
  } catch (error) {
    console.error("Admin order status update error:", error)
    return NextResponse.json({ message: "Sipariş güncellenirken bir hata oluştu." }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const { orderNo: rawOrderNo } = await params
    const orderNo = decodeURIComponent(rawOrderNo).trim()
    if (!orderNo) {
      return NextResponse.json({ message: "Geçersiz sipariş numarası." }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        items: true,
        payments: true,
        shipment: true,
        user: { select: { id: true, email: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    const snapshot = buildOrderDeletionSnapshot(order)
    const deletedAt = new Date().toISOString()
    const ipRaw = getClientIp(request)
    const ip =
      ipRaw && ipRaw !== "unknown" && ipRaw.length > 0 ? trunc(ipRaw, 45) : null

    await prisma.$transaction(async (tx) => {
      await tx.order.delete({ where: { id: order.id } })
      await tx.adminActivity.create({
        data: {
          actorUserId: session.userId,
          actorEmail: trunc(session.email.trim() || "unknown", 255),
          action: trunc(AdminActivityAction.ORDER_DELETE, 80),
          resourceType: trunc("Order", 80),
          resourceId: trunc(order.orderNo, 255),
          metadata: sanitizeAdminActivityMetadata(
            {
              deletedAt,
              order: snapshot,
            },
            { generous: true }
          ),
          ip,
        },
      })
    })

    return NextResponse.json({
      message: "Sipariş kalıcı olarak silindi. Kayıt işlem günlüğüne yazıldı.",
      orderNo: order.orderNo,
    })
  } catch (error) {
    console.error("Admin order DELETE error:", error)
    return NextResponse.json({ message: "Sipariş silinirken bir hata oluştu." }, { status: 500 })
  }
}
