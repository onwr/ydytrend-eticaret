import { NextResponse } from "next/server"
import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { computeProductDiscountFromPrices } from "@/lib/discountPercentage"
import { saveFile, isDataUrl } from "@/lib/storage"
import { AdminActivityAction, logAdminActivity } from "@/lib/adminActivityLog"
import { validateAttributeValues } from "@/lib/attributeValidation"
import { generateCombinationKey } from "@/lib/variantAttributes"
import { getErrorMessage, isPrismaUniqueViolation } from "@/lib/errors"
import type { RawAttrValue, RawProductImage, RawProductVariant } from "@/types/product-admin"
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          include: {
            attributeValues: {
              include: {
                attribute: { select: { id: true, name: true, slug: true, type: true } },
                value: { select: { id: true, value: true, slug: true, colorHex: true } },
              },
            },
          },
        },
        attributeValues: {
          include: {
            attribute: { select: { id: true, name: true, slug: true, type: true } },
            value: { select: { id: true, value: true, slug: true, colorHex: true } },
          },
        },
        category: true,
        subCategory: true,
        categories: { select: { categoryId: true } },
      }
    })

    if (!product) {
      return NextResponse.json({ message: "Ürün bulunamadı." }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: unknown) {
    console.error("Product GET error:", error)
    return NextResponse.json({ message: "Ürün yüklenirken bir hata oluştu." }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      subCategoryId,
      categoryIds,
      basePrice,
      compareAtPrice,
      sku,
      barcode,
      isActive,
      isFeatured,
      taxRate,
      isTaxIncluded,
      images,
      variants,
      productAttributeValues,
      metaTitle,
      metaDescription,
      slug,
      createdAt
    } = data

    const productId = Number(id)

    // SKU çakışması kontrolü
    if (sku) {
      const existingInProduct = await prisma.product.findFirst({
        where: { sku: String(sku), id: { not: productId } }
      })
      const existingInVariant = await prisma.productVariant.findFirst({
        where: { sku: String(sku), productId: { not: productId } }
      })
      if (existingInProduct || existingInVariant) {
        return NextResponse.json({ message: `"${sku}" stok kodu zaten başka bir üründe kullanılıyor.` }, { status: 400 })
      }
    }

    // Sadece gönderilen alanları güncellemek için bir updateData objesi oluştur
    const updateData: Prisma.ProductUpdateInput = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription
    if (categoryId !== undefined) {
      updateData.category = categoryId
        ? { connect: { id: Number(categoryId) } }
        : { disconnect: true }
    }
    if (subCategoryId !== undefined) {
      updateData.subCategory = subCategoryId
        ? { connect: { id: Number(subCategoryId) } }
        : { disconnect: true }
    }
    if (basePrice !== undefined) updateData.basePrice = Number(basePrice)
    if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? Number(compareAtPrice) : null
    if (basePrice !== undefined || compareAtPrice !== undefined) {
      const nextBase = basePrice !== undefined ? Number(basePrice) : undefined
      const nextCompare =
        compareAtPrice !== undefined
          ? compareAtPrice
            ? Number(compareAtPrice)
            : null
          : undefined
      const existing = await prisma.product.findUnique({
        where: { id: Number(id) },
        select: { basePrice: true, compareAtPrice: true },
      })
      if (existing) {
        const b = nextBase ?? Number(existing.basePrice)
        const c =
          nextCompare !== undefined
            ? nextCompare
            : existing.compareAtPrice
              ? Number(existing.compareAtPrice)
              : null
        updateData.discountPercentage = computeProductDiscountFromPrices(b, c)
      }
    }
    if (sku !== undefined) updateData.sku = sku
    if (barcode !== undefined) updateData.barcode = barcode
    if (isActive !== undefined) updateData.isActive = isActive
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (taxRate !== undefined) updateData.taxRate = Number(taxRate)
    if (isTaxIncluded !== undefined) updateData.isTaxIncluded = isTaxIncluded
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (createdAt) updateData.createdAt = new Date(createdAt)

    // Görseller, varyantlar veya özellikler varsa işlem yap
    if (images !== undefined || variants !== undefined || categoryIds !== undefined || productAttributeValues !== undefined) {
      return await prisma.$transaction(async (tx) => {
        if (images !== undefined) {
          const processedImages = await Promise.all(
            (images || []).map((img: RawProductImage) => {
              const url = typeof img === "string" ? img : img.url
              if (!url) return Promise.resolve(null)
              return saveFile(url, "products")
            })
          )
          const validImageUrls = processedImages.filter(url => url !== null) as string[]

          await tx.productImage.deleteMany({ where: { productId: Number(id) } })
          updateData.images = {
            create: validImageUrls.map((url: string, index: number) => ({
              url,
              sortOrder: index,
              isCover: index === 0
            }))
          }
        }

        if (variants !== undefined) {
          const variantList: RawProductVariant[] = variants || []

          // Tüm attributeValue çiftlerini toplu doğrula
          const allPairs = variantList.flatMap((v) =>
            Array.isArray(v.attributeValues)
              ? v.attributeValues.map((av: RawAttrValue) => ({
                  attributeId: Number(av.attributeId),
                  valueId: Number(av.valueId),
                }))
              : []
          )
          if (allPairs.length > 0) {
            const validation = await validateAttributeValues(allPairs)
            if (!validation.valid) {
              throw new Error(`Geçersiz özellik değeri: ${validation.message}`)
            }
          }

          // Gönderilen varyantlardan mevcut DB id'lerini ayır
          const sentDbIds = variantList
            .map((v) => (typeof v.id === "number" && Number.isInteger(v.id) ? v.id : null))
            .filter((n: number | null): n is number => n !== null)

          // Listede olmayan DB varyantlarını bul
          const removedVariants = await tx.productVariant.findMany({
            where: {
              productId: Number(id),
              ...(sentDbIds.length > 0 ? { id: { notIn: sentDbIds } } : {}),
            },
            select: {
              id: true,
              stock: true,
              _count: {
                select: { orderItems: true, cartItems: true, stockMovements: true },
              },
            },
          })

          for (const rv of removedVariants) {
            const isUsed =
              rv._count.orderItems > 0 ||
              rv._count.cartItems > 0 ||
              rv._count.stockMovements > 0
            const hasStock = rv.stock > 0

            if (isUsed || hasStock) {
              // Soft-delete: pasifleştir, silme
              await tx.productVariant.update({
                where: { id: rv.id },
                data: { isActive: false },
              })
            } else {
              await tx.productVariant.delete({ where: { id: rv.id } })
            }
          }

          // Her varyantı upsert et
          for (const v of variantList) {
            const dbId = typeof v.id === "number" && Number.isInteger(v.id) ? v.id : null
            const attrPairs: { attributeId: number; valueId: number }[] = Array.isArray(v.attributeValues)
              ? v.attributeValues.map((av: RawAttrValue) => ({
                  attributeId: Number(av.attributeId),
                  valueId: Number(av.valueId),
                }))
              : []
            const combinationKey = generateCombinationKey(attrPairs)
            const imageUrl = await normalizeVariantImageUrl(v.imageUrl)

            if (dbId) {
              // Mevcut varyant — sadece alanları güncelle
              await tx.productVariant.update({
                where: { id: dbId },
                data: {
                  name: v.name || "Standart",
                  sku: v.sku || undefined,
                  price: Number(v.price || (basePrice || 0)),
                  compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
                  stock: Number(v.stock ?? 0),
                  lowStockThreshold: Number(v.lowStockThreshold ?? 5),
                  combinationKey,
                  ...(v.imageUrl !== undefined ? { imageUrl } : {}),
                },
              })
              // AttributeValue'ları sıfırla + yeniden ekle
              if (attrPairs.length > 0) {
                await tx.productVariantAttributeValue.deleteMany({ where: { variantId: dbId } })
                await tx.productVariantAttributeValue.createMany({
                  data: attrPairs.map((av) => ({ variantId: dbId, ...av })),
                  skipDuplicates: true,
                })
              }
            } else {
              // Yeni varyant — oluştur
              const newSku = v.sku || `${sku || slug || "VAR"}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
              await tx.productVariant.create({
                data: {
                  productId: Number(id),
                  name: v.name || "Standart",
                  sku: newSku,
                  price: Number(v.price || (basePrice || 0)),
                  compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
                  stock: Number(v.stock ?? 0),
                  lowStockThreshold: Number(v.lowStockThreshold ?? 5),
                  isActive: true,
                  combinationKey,
                  imageUrl,
                  attributeValues: attrPairs.length > 0
                    ? { create: attrPairs }
                    : undefined,
                },
              })
            }
          }
        }

        // Ürün düzeyi özellikler (varyant oluşturmayan)
        if (productAttributeValues !== undefined) {
          const pavList: { attributeId: number; valueId: number }[] = Array.isArray(productAttributeValues)
            ? productAttributeValues.map((av: RawAttrValue) => ({
                attributeId: Number(av.attributeId),
                valueId: Number(av.valueId),
              }))
            : []
          if (pavList.length > 0) {
            const pavValidation = await validateAttributeValues(pavList)
            if (!pavValidation.valid) {
              throw new Error(`Geçersiz ürün özellik değeri: ${pavValidation.message}`)
            }
          }
          await tx.productAttributeValue.deleteMany({ where: { productId: Number(id) } })
          if (pavList.length > 0) {
            await tx.productAttributeValue.createMany({
              data: pavList.map((av) => ({ productId: Number(id), ...av })),
              skipDuplicates: true,
            })
          }
        }

        if (categoryIds !== undefined) {
          const extraIds = Array.isArray(categoryIds) ? categoryIds : []
          const primary = categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : undefined
          const sub = subCategoryId !== undefined ? (subCategoryId ? Number(subCategoryId) : null) : undefined

          const ids = Array.from(
            new Set(
              [
                ...(primary === undefined ? [] : [primary]),
                ...(sub === undefined ? [] : [sub]),
                ...extraIds,
              ]
                .map((n) => (n === null || n === undefined ? null : Number(n)))
                .filter((n): n is number => Number.isInteger(n))
            )
          )

          await tx.productCategory.deleteMany({ where: { productId: Number(id) } })
          if (ids.length) {
            await tx.productCategory.createMany({
              data: ids.map((cid) => ({ productId: Number(id), categoryId: cid })),
              skipDuplicates: true,
            })
          }
        }

        const updated = await tx.product.update({
          where: { id: Number(id) },
          data: updateData
        })
        await logAdminActivity(prisma, session, {
          action: AdminActivityAction.PRODUCT_UPDATE,
          resourceType: "Product",
          resourceId: String(id),
          metadata: { slug: updated.slug, name: updated.name, mediaOrVariants: true },
          request,
        })
        return NextResponse.json(updated)
      })
    }

    // Sadece basit alanlar güncellenecekse
    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: updateData
    })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.PRODUCT_UPDATE,
      resourceType: "Product",
      resourceId: String(id),
      metadata: { slug: updatedProduct.slug, name: updatedProduct.name },
      request,
    })
    return NextResponse.json(updatedProduct)
  } catch (error: unknown) {
    console.error("Product PUT error:", error)
    if (isPrismaUniqueViolation(error)) {
      return NextResponse.json({ message: "Bu SKU veya barkod zaten kullanılıyor." }, { status: 400 })
    }
    return NextResponse.json({ message: "Ürün güncellenirken bir hata oluştu: " + getErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    await prisma.product.delete({
      where: { id: Number(id) }
    })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.PRODUCT_DELETE,
      resourceType: "Product",
      resourceId: String(id),
      request,
    })
    return NextResponse.json({ message: "Ürün silindi." })
  } catch (error: unknown) {
    console.error("Product DELETE error:", error)
    return NextResponse.json({ message: "Ürün silinirken bir hata oluştu." }, { status: 500 })
  }
}
