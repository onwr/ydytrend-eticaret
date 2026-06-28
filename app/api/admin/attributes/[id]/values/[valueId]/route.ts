import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { isPrismaForeignKeyViolation } from "@/lib/errors"
import { validateColorHexForAttribute } from "@/lib/storefront/colorHexValidation"
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

type Ctx = { params: Promise<{ id: string; valueId: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const session = await requireAdmin()
    const { id, valueId } = await params
    const numericValueId = Number(valueId)
    const before = await prisma.attributeValue.findUnique({
      where: { id: numericValueId },
      select: { value: true, slug: true, isActive: true, attributeId: true },
    })
    if (!before) {
      return NextResponse.json({ message: "Değer bulunamadı." }, { status: 404 })
    }

    const data = await request.json()
    const allowed = ["value", "slug", "colorHex", "imageUrl", "sortOrder", "isActive"]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in data) update[key] = data[key]
    }
    if (update.slug) update.slug = String(update.slug).toLowerCase()

    if ("colorHex" in update) {
      const existing = await prisma.attributeValue.findUnique({
        where: { id: numericValueId },
        select: { attribute: { select: { type: true } } },
      })
      if (!existing) {
        return NextResponse.json({ message: "Değer bulunamadı." }, { status: 404 })
      }
      const hexCheck = validateColorHexForAttribute(
        existing.attribute.type,
        update.colorHex as string | null | undefined
      )
      if (!hexCheck.ok) {
        return NextResponse.json({ message: hexCheck.message }, { status: 400 })
      }
      update.colorHex = hexCheck.colorHex
    }

    const attrValue = await prisma.attributeValue.update({
      where: { id: numericValueId },
      data: update,
    })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.ATTRIBUTE_VALUE_UPDATE,
      resourceType: "AttributeValue",
      resourceId: String(numericValueId),
      metadata: {
        attributeId: Number(id),
        before,
        after: { value: attrValue.value, slug: attrValue.slug, isActive: attrValue.isActive },
      },
      request,
    })

    return NextResponse.json(attrValue)
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const session = await requireAdmin()
    const { id, valueId } = await params
    const numericValueId = Number(valueId)
    const before = await prisma.attributeValue.findUnique({
      where: { id: numericValueId },
      select: { value: true, slug: true, attributeId: true },
    })

    await prisma.attributeValue.delete({ where: { id: numericValueId } })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.ATTRIBUTE_VALUE_DELETE,
      resourceType: "AttributeValue",
      resourceId: String(numericValueId),
      metadata: {
        attributeId: Number(id),
        before: before ?? undefined,
      },
      request,
    })

    return new NextResponse(null, { status: 204 })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    if (isPrismaForeignKeyViolation(e))
      return NextResponse.json(
        { message: "Bu değer ürünlerde kullanılıyor, silinemez." },
        { status: 409 }
      )
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}
