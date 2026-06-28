import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { getErrorMessage, isPrismaUniqueViolation } from "@/lib/errors"
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

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireAdmin()
    const { id } = await params
    const values = await prisma.attributeValue.findMany({
      where: { attributeId: Number(id) },
      orderBy: [{ sortOrder: "asc" }, { value: "asc" }],
    })
    return NextResponse.json({ items: values })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const attributeId = Number(id)
    const { value, slug, colorHex, imageUrl, sortOrder } = await request.json()

    if (!value?.trim() || !slug?.trim()) {
      return NextResponse.json({ message: "Değer ve slug zorunludur." }, { status: 400 })
    }

    const attribute = await prisma.attribute.findUnique({
      where: { id: attributeId },
      select: { type: true },
    })
    if (!attribute) {
      return NextResponse.json({ message: "Özellik bulunamadı." }, { status: 404 })
    }

    const hexCheck = validateColorHexForAttribute(attribute.type, colorHex)
    if (!hexCheck.ok) {
      return NextResponse.json({ message: hexCheck.message }, { status: 400 })
    }

    const attrValue = await prisma.attributeValue.create({
      data: {
        attributeId,
        value: value.trim(),
        slug: slug.trim().toLowerCase(),
        colorHex: hexCheck.colorHex,
        imageUrl: imageUrl?.trim() || null,
        sortOrder: sortOrder ?? 0,
      },
    })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.ATTRIBUTE_VALUE_CREATE,
      resourceType: "AttributeValue",
      resourceId: String(attrValue.id),
      metadata: {
        attributeId,
        after: { value: attrValue.value, slug: attrValue.slug },
      },
      request,
    })

    return NextResponse.json(attrValue, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    if (isPrismaUniqueViolation(e))
      return NextResponse.json(
        { message: "Bu attribute altında aynı slug zaten var." },
        { status: 409 }
      )
    return NextResponse.json({ message: "Hata oluştu: " + getErrorMessage(e) }, { status: 500 })
  }
}
