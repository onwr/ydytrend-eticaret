import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { isDataUrl, saveFile } from "@/lib/storage"
import slugify from "slugify"
import { AdminActivityAction, logAdminActivity } from "@/lib/adminActivityLog"
import { validateAttributeValues } from "@/lib/attributeValidation"
import { generateCombinationKey } from "@/lib/variantAttributes"
import { validateVariantImageUrl } from "@/lib/variantImageUrlValidation"

async function normalizeVariantImageUrl(raw: unknown): Promise<string | null> {
  const v = validateVariantImageUrl(typeof raw === "string" ? raw : null)
  if (!v.ok) throw new Error(v.message)
  if (!v.url) return null
  if (isDataUrl(v.url)) {
    const uploaded = await saveFile(v.url, "products")
    return uploaded || null
  }
  return v.url
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const query = searchParams.get("q") || ""
    const categoryId = searchParams.get("categoryId")
    const skip = (page - 1) * limit

    const sort = searchParams.get("sort") || "createdAt"
    const dir = searchParams.get("dir") || "desc"

    const where: Record<string, unknown> = {}
    
    if (categoryId) {
      const parsed = parseInt(categoryId)
      if (!Number.isNaN(parsed)) {
        where.OR = [
          { categoryId: parsed },
          { subCategoryId: parsed },
          { categories: { some: { categoryId: parsed } } },
        ]
      }
    }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
        { barcode: { contains: query } },
        { description: { contains: query } },
      ]
    }

    const orderBy: Record<string, string> = {}
    if (sort === "stock") {
      // Prismada relation aggregation sorting desteklenmediği durumlarda basit tutuyoruz,
      // ama basePrice, name, createdAt kullanılabilir.
      orderBy["createdAt"] = dir
    } else {
      orderBy[sort] = dir
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              name: true
            }
          },
          images: {
            where: { isCover: true },
            take: 1
          }
        }
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      items: products,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Products GET error:", error)
    return NextResponse.json({ message: "Hata oluştu." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const data = await request.json()
    const {
      name,
      description,
      shortDescription,
      categoryId,
      categoryIds,
      basePrice,
      compareAtPrice,
      sku,
      barcode,
      isActive,
      isFeatured,
      taxRate,
      isTaxIncluded,
      metaTitle,
      metaDescription,
      images,
      variants,
      productAttributeValues,
      subCategoryId
    } = data

    if (!name || basePrice === undefined) {
      return NextResponse.json({ message: "Ad ve temel fiyat zorunludur." }, { status: 400 })
    }

    // SKU çakışması kontrolü (hem ana ürün hem varyantlarda)
    if (sku) {
      const existingInProduct = await prisma.product.findFirst({ where: { sku: String(sku) } })
      const existingInVariant = await prisma.productVariant.findFirst({ where: { sku: String(sku) } })
      if (existingInProduct || existingInVariant) {
        return NextResponse.json({ message: `"${sku}" stok kodu (SKU) zaten başka bir üründe veya varyantta kullanılıyor.` }, { status: 400 })
      }
    }

    // Slug oluştur (Türkçe karakter desteği ile)
    let slug = slugify(name, { lower: true, strict: true, locale: 'tr' })
    
    // Slug çakışması kontrolü
    let existing = await prisma.product.findUnique({ where: { slug } })
    let counter = 1
    const originalSlug = slug
    while (existing) {
      slug = `${originalSlug}-${counter}`
      existing = await prisma.product.findUnique({ where: { slug } })
      counter++
    }

    // Attribute değerlerini doğrula (tüm varyantlar + ürün düzeyi özellikler için toplu)
    type RawAttrValue = { attributeId: unknown; valueId: unknown }
    type RawVariant = { attributeValues?: RawAttrValue[]; name?: string; sku?: string; price?: unknown; stock?: unknown; lowStockThreshold?: unknown; imageUrl?: string | null }
    const allAttrPairs = [
      ...(variants || []).flatMap((v: RawVariant) =>
        Array.isArray(v.attributeValues)
          ? v.attributeValues.map((av: RawAttrValue) => ({
              attributeId: Number(av.attributeId),
              valueId: Number(av.valueId),
            }))
          : []
      ),
      ...(Array.isArray(productAttributeValues)
        ? (productAttributeValues as RawAttrValue[]).map((av) => ({
            attributeId: Number(av.attributeId),
            valueId: Number(av.valueId),
          }))
        : []),
    ]
    if (allAttrPairs.length > 0) {
      const validation = await validateAttributeValues(allAttrPairs)
      if (!validation.valid) {
        return NextResponse.json({ message: `Geçersiz özellik değeri: ${validation.message}` }, { status: 400 })
      }
    }

    // Görselleri CDN'e kaydet
    const finalImageUrls = await Promise.all(
       (images || []).map((img: string | { url: string }) => {
          const url = typeof img === 'string' ? img : img.url
          return saveFile(url, "products")
       })
    )
    const validImages = finalImageUrls.filter(url => url !== null) as string[]

    const variantRows = await Promise.all(
      (variants || []).map(async (v: RawVariant) => ({
        ...v,
        imageUrl: await normalizeVariantImageUrl(v.imageUrl),
      }))
    )

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        shortDescription,
        categoryId: categoryId ? Number(categoryId) : null,
        subCategoryId: subCategoryId ? Number(subCategoryId) : null,
        basePrice: Number(basePrice),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        sku,
        barcode,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        taxRate: taxRate ? Number(taxRate) : 20,
        isTaxIncluded: isTaxIncluded ?? true,
        metaTitle,
        metaDescription,
        images: {
          create: validImages.map((url: string, index: number) => ({
            url,
            sortOrder: index,
            isCover: index === 0
          }))
        },
        variants: {
          create: variantRows.map((v: RawVariant) => ({
            name: v.name || "Standart",
            sku: v.sku || `${sku || slug}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            price: Number(v.price || basePrice),
            stock: Number(v.stock || 0),
            lowStockThreshold: Number(v.lowStockThreshold || 5),
            isActive: true,
            imageUrl: v.imageUrl ?? null,
            combinationKey: generateCombinationKey(
              Array.isArray(v.attributeValues)
                ? v.attributeValues.map((av: RawAttrValue) => ({
                    attributeId: Number(av.attributeId),
                    valueId: Number(av.valueId),
                  }))
                : []
            ),
            attributeValues: Array.isArray(v.attributeValues) && v.attributeValues.length > 0
              ? {
                  create: v.attributeValues.map((av: RawAttrValue) => ({
                    attributeId: Number(av.attributeId),
                    valueId: Number(av.valueId),
                  })),
                }
              : undefined,
          }))
        },
        attributeValues: Array.isArray(productAttributeValues) && productAttributeValues.length > 0
          ? {
              create: productAttributeValues.map((av: RawAttrValue) => ({
                attributeId: Number(av.attributeId),
                valueId: Number(av.valueId),
              })),
            }
          : undefined,
      },
      include: {
        categories: { select: { categoryId: true } },
      },
    })

    // Çoklu kategori linkleri (primary + seçili)
    const extraIds = Array.isArray(categoryIds) ? categoryIds : []
    const ids = Array.from(
      new Set(
        [categoryId ? Number(categoryId) : null, subCategoryId ? Number(subCategoryId) : null, ...extraIds]
          .map((n) => (n === null || n === undefined ? null : Number(n)))
          .filter((n): n is number => Number.isInteger(n))
      )
    )
    if (ids.length) {
      await prisma.productCategory.createMany({
        data: ids.map((cid) => ({ productId: product.id, categoryId: cid })),
        skipDuplicates: true,
      })
    }

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.PRODUCT_CREATE,
      resourceType: "Product",
      resourceId: String(product.id),
      metadata: { slug: product.slug, name: String(name ?? "").slice(0, 120) },
      request,
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Product creation error:", error)
    const err = error as { code?: string; message?: string }
    if (err.code === 'P2002') {
      return NextResponse.json({ message: "Bu SKU veya barkod zaten başka bir üründe kullanılıyor." }, { status: 400 })
    }
    return NextResponse.json({ message: "Ürün eklenirken bir hata oluştu: " + err.message }, { status: 500 })
  }
}
