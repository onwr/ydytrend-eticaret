import { NextResponse } from "next/server"
import {
  getAuthedUserId,
  getGuestFavoriteIdsFromCookie,
  setGuestFavoritesCookieOnResponse,
} from "@/lib/favoriteSession"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { productId: rawProductId } = (await request.json()) as { productId?: number | string }
    const productId = Number(rawProductId)
    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json({ message: "Ürün ID gereklidir." }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ message: "Ürün bulunamadı." }, { status: 404 })
    }

    const userId = await getAuthedUserId()

    if (userId) {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_productId: { userId, productId },
        },
      })

      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } })
        return NextResponse.json({ message: "Ürün favorilerden çıkarıldı.", isFavorite: false })
      }

      await prisma.favorite.create({
        data: { userId, productId },
      })
      return NextResponse.json({ message: "Ürün favorilere eklendi.", isFavorite: true })
    }

    const current = await getGuestFavoriteIdsFromCookie()
    const exists = current.includes(productId)
    const next = exists ? current.filter((id) => id !== productId) : [productId, ...current]

    const res = NextResponse.json({
      message: exists ? "Ürün favorilerden çıkarıldı." : "Ürün favorilere eklendi.",
      isFavorite: !exists,
    })
    setGuestFavoritesCookieOnResponse(res, next)
    return res
  } catch (error) {
    console.error("Favorite Toggle Error:", error)
    return NextResponse.json({ message: "İşlem sırasında bir hata oluştu." }, { status: 500 })
  }
}
