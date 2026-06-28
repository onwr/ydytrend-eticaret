import { NextResponse } from "next/server"
import type { Prisma } from "@/generated/prisma/client"
import { ReturnRequestStatus } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const query = searchParams.get("q")?.trim() || ""
    const skip = (page - 1) * limit

    const where: Prisma.ReturnRequestWhereInput = {}

    if (status && status !== "ALL") {
      where.status = status as ReturnRequestStatus
    }
    if (type && type !== "ALL") {
      where.type = type as Prisma.ReturnRequestWhereInput["type"]
    }
    if (query) {
      where.OR = [
        { requestNumber: { contains: query } },
        { order: { orderNo: { contains: query } } },
        { user: { email: { contains: query } } },
        { user: { name: { contains: query } } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: { select: { orderNo: true } },
          user: { select: { name: true, email: true } },
          items: { select: { id: true } },
        },
      }),
      prisma.returnRequest.count({ where }),
    ])

    const summary = await prisma.returnRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    })

    const summaryMap: Record<string, number> = {}
    for (const row of summary) {
      summaryMap[row.status] = row._count._all
    }

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: summaryMap,
    })
  } catch (error) {
    console.error("Admin returns list error:", error)
    return NextResponse.json({ message: "Liste yüklenemedi." }, { status: 500 })
  }
}
