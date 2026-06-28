import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { resolveProductCardPrice } from "@/lib/storefront/formatPrice"
import { getClientIp } from "@/lib/getClientIp"
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit"
import { jsonRateLimited } from "@/lib/apiError"

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const rl = await consumeRateLimit(
    `search:${ip}`,
    RATE_LIMITS.search.max,
    RATE_LIMITS.search.windowMs
  )
  if (!rl.allowed) {
    return jsonRateLimited(rl.retryAfterSeconds ?? 60)
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ products: [], categories: [] })
  }

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { slug: { contains: query } },
            { sku: { contains: query } },
            { description: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          compareAtPrice: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 2,
            select: { url: true, isCover: true },
          },
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { price: true, compareAtPrice: true },
          },
          category: { select: { name: true, slug: true } },
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: {
          OR: [{ name: { contains: query } }, { slug: { contains: query } }],
        },
        select: { id: true, name: true, slug: true, imageUrl: true },
        take: 4,
        orderBy: { sortOrder: "asc" },
      }),
    ])

    const enriched = products.map((p) => {
      const variant = p.variants[0]
      const sell = variant?.price ?? p.basePrice
      const pricing = resolveProductCardPrice(
        Number(sell),
        p.compareAtPrice != null
          ? Number(p.compareAtPrice)
          : variant?.compareAtPrice != null
            ? Number(variant.compareAtPrice)
            : null
      )
      return { ...p, pricing }
    })

    return NextResponse.json({ products: enriched, categories })
  } catch (error) {
    console.error("Search API Error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
