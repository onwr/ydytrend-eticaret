import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { getErrorMessage, isPrismaUniqueViolation } from "@/lib/errors"
import {
  AdminActivityAction,
  logAdminActivity,
  type AdminSession,
} from "@/lib/adminActivityLog"

async function requireAdmin(): Promise<AdminSession> {
  const s = await getSessionFromCookies()
  if (!s || s.role !== "ADMIN") throw new Response("Yetkisiz erişim.", { status: 403 })
  return s
}

export async function GET() {
  try {
    await requireAdmin()
    const attributes = await prisma.attribute.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        values: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { value: "asc" }],
        },
        _count: { select: { categoryAttributes: true } },
      },
    })
    return NextResponse.json({ items: attributes })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const { name, slug, type, isVariant, isFilterable, isRequired, sortOrder } =
      await request.json()

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ message: "Ad ve slug zorunludur." }, { status: 400 })
    }

    const attribute = await prisma.attribute.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        type: type ?? "SELECT",
        isVariant: isVariant ?? true,
        isFilterable: isFilterable ?? false,
        isRequired: isRequired ?? false,
        sortOrder: sortOrder ?? 0,
      },
    })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.ATTRIBUTE_CREATE,
      resourceType: "Attribute",
      resourceId: String(attribute.id),
      metadata: {
        after: { name: attribute.name, slug: attribute.slug, type: attribute.type },
      },
      request,
    })

    return NextResponse.json(attribute, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    if (isPrismaUniqueViolation(e))
      return NextResponse.json({ message: "Bu slug zaten kullanılıyor." }, { status: 409 })
    return NextResponse.json({ message: "Hata oluştu: " + getErrorMessage(e) }, { status: 500 })
  }
}
