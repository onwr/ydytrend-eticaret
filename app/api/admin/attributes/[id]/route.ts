import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import {
  isPrismaForeignKeyViolation,
  isPrismaUniqueViolation,
} from "@/lib/errors"
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

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireAdmin()
    const { id } = await params
    const attribute = await prisma.attribute.findUnique({
      where: { id: Number(id) },
      include: {
        values: { orderBy: [{ sortOrder: "asc" }, { value: "asc" }] },
        categoryAttributes: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    })
    if (!attribute) return NextResponse.json({ message: "Bulunamadı." }, { status: 404 })
    return NextResponse.json(attribute)
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const attributeId = Number(id)
    const before = await prisma.attribute.findUnique({
      where: { id: attributeId },
      select: { name: true, slug: true, type: true, isActive: true, isVariant: true },
    })
    if (!before) return NextResponse.json({ message: "Bulunamadı." }, { status: 404 })

    const data = await request.json()
    const allowed = ["name", "slug", "type", "isVariant", "isFilterable", "isRequired", "isActive", "sortOrder"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }
    if (update.slug) update.slug = String(update.slug).toLowerCase()

    const attribute = await prisma.attribute.update({ where: { id: attributeId }, data: update })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.ATTRIBUTE_UPDATE,
      resourceType: "Attribute",
      resourceId: String(attributeId),
      metadata: {
        before,
        after: {
          name: attribute.name,
          slug: attribute.slug,
          type: attribute.type,
          isActive: attribute.isActive,
          isVariant: attribute.isVariant,
        },
      },
      request,
    })

    return NextResponse.json(attribute)
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    if (isPrismaUniqueViolation(e))
      return NextResponse.json({ message: "Bu slug zaten kullanılıyor." }, { status: 409 })
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const attributeId = Number(id)
    const before = await prisma.attribute.findUnique({
      where: { id: attributeId },
      select: { name: true, slug: true },
    })

    await prisma.attribute.delete({ where: { id: attributeId } })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.ATTRIBUTE_DELETE,
      resourceType: "Attribute",
      resourceId: String(attributeId),
      metadata: before ? { before } : undefined,
      request,
    })

    return new NextResponse(null, { status: 204 })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    if (isPrismaForeignKeyViolation(e))
      return NextResponse.json(
        { message: "Bu özellik ürünlerde kullanılıyor, silinemez." },
        { status: 409 }
      )
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}
