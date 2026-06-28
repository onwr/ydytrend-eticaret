import { NextResponse } from "next/server"
import { getAuthedUserId, getGuestFavoriteIdsFromCookie } from "@/lib/favoriteSession"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const userId = await getAuthedUserId()

    let productIds: number[] = []
    if (userId) {
      const rows = await prisma.favorite.findMany({
        where: { userId },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
      })
      productIds = rows.map((r) => r.productId)
    } else {
      productIds = await getGuestFavoriteIdsFromCookie()
    }

    if (productIds.length === 0) {
      return NextResponse.json({ productIds: [], items: [] })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
        variants: { where: { isActive: true }, take: 1, select: { price: true, stock: true } },
      },
    })

    const byId = new Map(products.map((p) => [p.id, p]))
    const items = productIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        id: p.id,
        productId: p.id,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          basePrice: Number(p.basePrice),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          images: p.images.map((img) => ({ url: img.url, isCover: img.isCover })),
          variants: p.variants.map((v) => ({ price: Number(v.price), stock: v.stock })),
        },
      }))

    return NextResponse.json({
      productIds,
      items,
    })
  } catch (error) {
    console.error("Favorites GET error:", error)
    return NextResponse.json({ message: "Favoriler yüklenemedi." }, { status: 500 })
  }
}
