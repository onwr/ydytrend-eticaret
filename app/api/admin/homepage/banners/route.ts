import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { resolveImageUrl } from "@/lib/storage"
import { AdminActivityAction, logAdminActivity } from "@/lib/adminActivityLog"

export async function GET() {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Yetkisiz." }, { status: 403 })

    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: "asc" }
    })
    return NextResponse.json(banners)
  } catch (error) {
    return NextResponse.json({ message: "Hata" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Yetkisiz." }, { status: 403 })

    const body = await request.json()
    const resolved = await resolveImageUrl(body.imageUrl, "homepage")
    if (!resolved.ok) {
      return NextResponse.json({ message: resolved.message }, { status: resolved.message.includes("zorunlu") ? 400 : 500 })
    }
    const banner = await prisma.banner.create({
      data: {
        title: body.title,
        imageUrl: resolved.url,
        linkUrl: body.linkUrl,
        position: body.position || "top-row",
        sortOrder: parseInt(body.sortOrder || "0"),
        isActive: body.isActive ?? true
      }
    })
    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.HOMEPAGE_BANNER_CREATE,
      resourceType: "Banner",
      resourceId: String(banner.id),
      metadata: { title: banner.title },
      request,
    })
    return NextResponse.json(banner)
  } catch (error) {
    return NextResponse.json({ message: "Hata" }, { status: 500 })
  }
}
