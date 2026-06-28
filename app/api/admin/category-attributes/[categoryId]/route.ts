import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { getErrorMessage } from "@/lib/errors"

async function guard() {
  const s = await getSessionFromCookies()
  if (!s || s.role !== "ADMIN") throw new Response("Yetkisiz erişim.", { status: 403 })
}

type Ctx = { params: Promise<{ categoryId: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await guard()
    const { categoryId } = await params
    const rows = await prisma.categoryAttribute.findMany({
      where: { categoryId: Number(categoryId) },
      include: {
        attribute: {
          include: {
            values: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { value: "asc" }],
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json({ items: rows })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}

/** PUT replaces the full category-attribute set. Body: { attributeIds: number[] } */
export async function PUT(request: Request, { params }: Ctx) {
  try {
    await guard()
    const { categoryId } = await params
    const { attributeIds } = (await request.json()) as { attributeIds: number[] }

    if (!Array.isArray(attributeIds)) {
      return NextResponse.json({ message: "attributeIds dizisi gereklidir." }, { status: 400 })
    }

    const catId = Number(categoryId)

    // Mevcut kayıtları sil ve yeniden ekle (tablo küçük, upsert daha temiz)
    await prisma.$transaction([
      prisma.categoryAttribute.deleteMany({ where: { categoryId: catId } }),
      ...(attributeIds.length > 0
        ? [
            prisma.categoryAttribute.createMany({
              data: attributeIds.map((attributeId, i) => ({
                categoryId: catId,
                attributeId,
                sortOrder: i,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ])

    const rows = await prisma.categoryAttribute.findMany({
      where: { categoryId: catId },
      include: { attribute: { include: { values: { where: { isActive: true } } } } },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json({ items: rows })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    return NextResponse.json({ message: "Hata oluştu: " + getErrorMessage(e) }, { status: 500 })
  }
}

/** POST: attribute ekle veya güncelle */
export async function POST(request: Request, { params }: Ctx) {
  try {
    await guard()
    const { categoryId } = await params
    const { attributeId, isRequired, isVariant, isFilterable, sortOrder } =
      await request.json()

    if (!attributeId) {
      return NextResponse.json({ message: "attributeId zorunludur." }, { status: 400 })
    }

    const row = await prisma.categoryAttribute.upsert({
      where: { categoryId_attributeId: { categoryId: Number(categoryId), attributeId: Number(attributeId) } },
      create: {
        categoryId: Number(categoryId),
        attributeId: Number(attributeId),
        isRequired: isRequired ?? false,
        isVariant: isVariant ?? true,
        isFilterable: isFilterable ?? false,
        sortOrder: sortOrder ?? 0,
      },
      update: {
        isRequired: isRequired ?? false,
        isVariant: isVariant ?? true,
        isFilterable: isFilterable ?? false,
        sortOrder: sortOrder ?? 0,
      },
    })
    return NextResponse.json(row, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    return NextResponse.json({ message: "Hata oluştu: " + getErrorMessage(e) }, { status: 500 })
  }
}

/** DELETE: kategori-özellik bağını kaldır. Body: { attributeId } */
export async function DELETE(request: Request, { params }: Ctx) {
  try {
    await guard()
    const { categoryId } = await params
    const { attributeId } = await request.json()
    await prisma.categoryAttribute.delete({
      where: {
        categoryId_attributeId: {
          categoryId: Number(categoryId),
          attributeId: Number(attributeId),
        },
      },
    })
    return new NextResponse(null, { status: 204 })
  } catch (e: unknown) {
    if (e instanceof Response) return new NextResponse(e.body, { status: e.status })
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}
