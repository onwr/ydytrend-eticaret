import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookies } from "@/lib/authSession"
import { canCustomerCancelReturn } from "@/lib/returnStatusTransitions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestNumber: string }> }
) {
  try {
    const userId = await getUserIdFromCookies()
    if (!userId) {
      return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 })
    }

    const { requestNumber } = await params
    const req = await prisma.returnRequest.findUnique({
      where: { requestNumber },
      include: {
        order: { select: { orderNo: true, grandTotal: true, status: true } },
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
              },
            },
          },
        },
        attachments: true,
      },
    })

    if (!req || req.userId !== userId) {
      return NextResponse.json({ message: "Talep bulunamadı." }, { status: 404 })
    }

    return NextResponse.json({ request: req })
  } catch (error) {
    console.error("Return detail error:", error)
    return NextResponse.json({ message: "Talep yüklenemedi." }, { status: 500 })
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestNumber: string }> }
) {
  try {
    const userId = await getUserIdFromCookies()
    if (!userId) {
      return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 })
    }

    const { requestNumber } = await params
    const existing = await prisma.returnRequest.findUnique({
      where: { requestNumber },
      include: { order: { select: { orderNo: true } }, user: { select: { email: true } } },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Talep bulunamadı." }, { status: 404 })
    }

    if (!canCustomerCancelReturn(existing.status)) {
      return NextResponse.json(
        { message: "Bu talep artık iptal edilemez." },
        { status: 400 }
      )
    }

    const updated = await prisma.returnRequest.update({
      where: { id: existing.id, status: existing.status },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ message: "Talep iptal edildi.", request: updated })
  } catch (error) {
    console.error("Return cancel error:", error)
    return NextResponse.json({ message: "İptal işlemi başarısız." }, { status: 500 })
  }
}
