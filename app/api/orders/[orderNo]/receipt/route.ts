import { NextResponse } from "next/server"
import { PaymentMethod, PaymentStatus } from "@/generated/prisma/client"
import { getUserIdFromCookies } from "@/lib/authSession"
import { isAllowedReceiptMime, RECEIPT_MAX_BYTES } from "@/lib/receiptUpload"
import { saveFile } from "@/lib/storage"
import { prisma } from "@/lib/prisma"

type ReceiptBody = {
  receiptData?: string
  fileName?: string
}

function estimateBase64Bytes(dataUrl: string): number {
  const idx = dataUrl.indexOf(";base64,")
  if (idx === -1) return dataUrl.length
  const base64 = dataUrl.slice(idx + 8)
  return Math.floor((base64.length * 3) / 4)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const userId = await getUserIdFromCookies()
    if (!userId) {
      return NextResponse.json({ message: "Giriş yapmanız gerekiyor." }, { status: 401 })
    }

    const { orderNo } = await params
    const body = (await request.json()) as ReceiptBody
    const receiptData = body.receiptData?.trim()
    const fileName = body.fileName?.trim() || "dekont"

    if (!receiptData?.startsWith("data:")) {
      return NextResponse.json({ message: "Geçerli bir dekont dosyası gönderin." }, { status: 400 })
    }

    if (estimateBase64Bytes(receiptData) > RECEIPT_MAX_BYTES) {
      return NextResponse.json({ message: "Dosya en fazla 5 MB olabilir." }, { status: 400 })
    }

    const mimeMatch = /^data:([^;]+);base64,/.exec(receiptData)
    const mime = mimeMatch?.[1]?.toLowerCase() ?? ""
    if (!isAllowedReceiptMime(mime)) {
      return NextResponse.json(
        { message: "Yalnızca JPG, PNG, WEBP veya PDF yükleyebilirsiniz." },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: { orderNo, userId },
      include: {
        payments: { orderBy: { id: "desc" }, take: 1 },
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Sipariş bulunamadı." }, { status: 404 })
    }

    const payment = order.payments[0]
    if (!payment || payment.method !== PaymentMethod.BANK_TRANSFER) {
      return NextResponse.json({ message: "Bu sipariş havale/EFT ile ödenmemiş." }, { status: 400 })
    }

    if (payment.status === PaymentStatus.PAID) {
      return NextResponse.json({ message: "Bu siparişin ödemesi zaten onaylanmış." }, { status: 400 })
    }

    const url = await saveFile(receiptData, `receipts/${orderNo}`)
    if (!url) {
      return NextResponse.json(
        { message: "Dekont yüklenemedi. Lütfen daha sonra tekrar deneyin." },
        { status: 500 }
      )
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        receiptUrl: url,
        receiptFileName: fileName.slice(0, 255),
        receiptMimeType: mime,
        receiptUploadedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Dekontunuz alındı. Ödemeniz onaylandıktan sonra siparişiniz hazırlanacaktır.",
      receiptUrl: url,
    })
  } catch (error) {
    console.error("POST receipt error:", error)
    return NextResponse.json({ message: "Dekont yüklenirken hata oluştu." }, { status: 500 })
  }
}
