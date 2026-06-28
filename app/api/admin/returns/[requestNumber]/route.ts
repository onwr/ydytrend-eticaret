import { NextResponse } from "next/server"
import { after } from "next/server"
import {
  OrderStatus,
  RefundStatus,
  ReturnItemCondition,
  ReturnRequestType,
} from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import {
  AdminActivityAction,
  logAdminActivity,
  type AdminSession,
} from "@/lib/adminActivityLog"
import {
  validateReturnAdminAction,
  type ReturnAdminAction,
} from "@/lib/returnStatusTransitions"
import { recordOrderStatusChange } from "@/lib/orderStockRestore"
import { processReturnStockOnComplete } from "@/lib/returnStockProcess"
import {
  afterSalesEmailContent,
  returnStatusToEmailEvent,
} from "@/lib/emails/afterSalesEmails"
import { dispatchTransactionalEmail } from "@/lib/email/dispatch"

type PatchBody = {
  action?: ReturnAdminAction | "update_refund"
  adminNote?: string
  itemConditions?: Record<string, ReturnItemCondition>
  refundStatus?: RefundStatus
  refundAmount?: number
  refundMethod?: string
  refundReference?: string
  refundedAt?: string
  refundNote?: string
}

const ACTIONS: ReturnAdminAction[] = [
  "review",
  "approve",
  "reject",
  "product_received",
  "complete",
]

async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
  }
  return session
}

function maskRefundReference(ref?: string | null): string | null {
  if (!ref?.trim()) return null
  const t = ref.trim()
  if (t.length <= 4) return "****"
  return `${"*".repeat(Math.min(t.length - 4, 8))}${t.slice(-4)}`
}

function queueReturnEmail(
  params: {
    to: string
    event: Parameters<typeof afterSalesEmailContent>[0]["event"]
    orderNo: string
    requestNumber: string
    items: { name: string; quantity: number }[]
    customerNote?: string | null
  }
) {
  after(async () => {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
      const content = afterSalesEmailContent({
        siteUrl,
        event: params.event,
        orderNo: params.orderNo,
        requestNumber: params.requestNumber,
        items: params.items,
        customerNote: params.customerNote,
      })
      await dispatchTransactionalEmail(prisma, {
        type: params.event,
        to: params.to,
        idempotencyKey: `return:${params.requestNumber}:${params.event}`,
        payload: {
          subject: content.subject,
          text: content.text,
          html: content.html,
        },
      })
    } catch (e) {
      console.error("Return email error:", e)
    }
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestNumber: string }> }
) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { requestNumber } = await params
    const req = await prisma.returnRequest.findUnique({
      where: { requestNumber },
      include: {
        order: {
          select: {
            orderNo: true,
            status: true,
            grandTotal: true,
            shippingFullName: true,
            shippingPhone: true,
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            orderItem: {
              select: {
                name: true,
                sku: true,
                variantSku: true,
                variantSnapshotJson: true,
                unitPrice: true,
                quantity: true,
                lineTotal: true,
              },
            },
          },
        },
        attachments: true,
      },
    })

    if (!req) {
      return NextResponse.json({ message: "Talep bulunamadı." }, { status: 404 })
    }

    return NextResponse.json({ request: req })
  } catch (error) {
    console.error("Admin return detail error:", error)
    return NextResponse.json({ message: "Talep yüklenemedi." }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestNumber: string }> }
) {
  try {
    const session = await requireAdmin()
    if (session instanceof NextResponse) return session

    const { requestNumber } = await params
    const body = (await request.json()) as PatchBody

    const existing = await prisma.returnRequest.findUnique({
      where: { requestNumber },
      include: {
        order: { include: { payments: { orderBy: { id: "desc" }, take: 1 } } },
        items: { include: { orderItem: { select: { productId: true, variantId: true, name: true, lineTotal: true } } } },
        user: { select: { email: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ message: "Talep bulunamadı." }, { status: 404 })
    }

    if (body.action === "update_refund") {
      if (existing.status === "COMPLETED" && existing.refundStatus === "COMPLETED") {
        return NextResponse.json(
          { message: "Tamamlanmış finansal iade tekrar işlenemez." },
          { status: 400 }
        )
      }

      const refundAmount =
        body.refundAmount !== undefined ? Number(body.refundAmount) : undefined
      if (refundAmount !== undefined && (Number.isNaN(refundAmount) || refundAmount < 0)) {
        return NextResponse.json({ message: "İade tutarı negatif olamaz." }, { status: 400 })
      }

      const maxRefund = existing.items.reduce(
        (sum, it) => sum + Number(it.orderItem.lineTotal),
        0
      )
      if (refundAmount !== undefined && refundAmount > maxRefund) {
        return NextResponse.json(
          { message: "İade tutarı kalem toplamını aşamaz." },
          { status: 400 }
        )
      }

      const updated = await prisma.returnRequest.update({
        where: { id: existing.id },
        data: {
          refundStatus: body.refundStatus ?? existing.refundStatus,
          refundAmount: refundAmount !== undefined ? refundAmount : existing.refundAmount,
          refundMethod: body.refundMethod?.trim() || existing.refundMethod,
          refundReference: body.refundReference?.trim() || existing.refundReference,
          refundedAt: body.refundedAt ? new Date(body.refundedAt) : existing.refundedAt,
          refundNote: body.refundNote?.trim() || existing.refundNote,
        },
      })

      await logAdminActivity(prisma, session, {
        action: AdminActivityAction.REFUND_UPDATE,
        resourceType: "return_request",
        resourceId: requestNumber,
        metadata: {
          before: {
            refundStatus: existing.refundStatus,
            refundAmount: existing.refundAmount ? Number(existing.refundAmount) : null,
          },
          after: {
            refundStatus: updated.refundStatus,
            refundAmount: updated.refundAmount ? Number(updated.refundAmount) : null,
            refundReference: maskRefundReference(updated.refundReference),
          },
        },
        request,
      })

      return NextResponse.json({ message: "Finansal iade bilgisi güncellendi.", request: updated })
    }

    const action = body.action
    if (!action || !ACTIONS.includes(action)) {
      return NextResponse.json({ message: "Geçersiz işlem." }, { status: 400 })
    }

    const check = validateReturnAdminAction(existing.status, action)
    if (!check.ok) {
      return NextResponse.json({ message: check.message }, { status: 400 })
    }

    const now = new Date()
    const adminNote = body.adminNote?.trim() || existing.adminNote

    const emailItems = existing.items.map((it) => ({
      name: it.orderItem.name,
      quantity: it.quantity,
    }))

    const updated = await prisma.$transaction(async (tx) => {
      if (body.itemConditions && Object.keys(body.itemConditions).length > 0) {
        for (const item of existing.items) {
          const cond = body.itemConditions[String(item.id)]
          if (cond) {
            await tx.returnRequestItem.update({
              where: { id: item.id },
              data: { condition: cond },
            })
            item.condition = cond
          }
        }
      }

      const data: Parameters<typeof tx.returnRequest.update>[0]["data"] = {
        status: check.nextStatus,
        adminNote,
      }

      if (action === "review") {
        data.status = "UNDER_REVIEW"
      }
      if (action === "approve") {
        data.approvedAt = now
        data.status = "WAITING_FOR_PRODUCT"
      }
      if (action === "reject") {
        data.rejectedAt = now
      }
      if (action === "complete") {
        data.completedAt = now
        if (existing.type === ReturnRequestType.RETURN && existing.refundStatus === "PENDING") {
          data.refundStatus = RefundStatus.MANUAL_PROCESSING
        }
      }

      const req = await tx.returnRequest.update({
        where: { id: existing.id, status: existing.status },
        data,
        include: {
          order: { select: { orderNo: true } },
          user: { select: { name: true, email: true } },
          items: {
            include: {
              orderItem: { select: { productId: true, variantId: true, name: true } },
            },
          },
        },
      })

      if (action === "complete") {
        await processReturnStockOnComplete(tx, {
          returnRequestId: existing.id,
          orderId: existing.orderId,
          type: existing.type,
          requestNumber,
          stockRestoredAt: existing.stockRestoredAt,
          items: req.items.map((it) => ({
            id: it.id,
            quantity: it.quantity,
            condition: it.condition,
            requestedVariantId: it.requestedVariantId,
            orderItem: {
              productId: it.orderItem.productId,
              variantId: it.orderItem.variantId,
            },
          })),
        })

        if (existing.type === ReturnRequestType.RETURN) {
          const order = existing.order
          if (order.status === OrderStatus.DELIVERED) {
            await tx.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.REFUNDED },
            })
            await recordOrderStatusChange(tx, {
              orderId: order.id,
              previousStatus: order.status,
              newStatus: OrderStatus.REFUNDED,
              source: "ADMIN",
              changedByUserId: session.userId,
              note: `İade tamamlandı: ${requestNumber}`,
            })
          }
        }
      }

      return req
    })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.RETURN_REQUEST_UPDATE,
      resourceType: "return_request",
      resourceId: requestNumber,
      metadata: {
        action,
        previousStatus: existing.status,
        newStatus: updated.status,
      },
      request,
    })

    const emailEvent = returnStatusToEmailEvent(updated.status, existing.type)
    if (emailEvent && existing.user.email) {
      queueReturnEmail({
        to: existing.user.email,
        event: emailEvent,
        orderNo: existing.order.orderNo,
        requestNumber,
        items: emailItems,
        customerNote: existing.customerNote,
      })
    }

    return NextResponse.json({
      message: "Talep güncellendi.",
      request: updated,
    })
  } catch (error) {
    console.error("Admin return update error:", error)
    const msg = error instanceof Error ? error.message : "Güncelleme başarısız."
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
