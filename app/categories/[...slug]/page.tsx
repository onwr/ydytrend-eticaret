import type { Metadata } from "next"
import type { Prisma } from "@/generated/prisma/client"
import Link from "next/link"
import { notFound } from "next/navigation"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import { prisma } from "@/lib/prisma"
import { CategoryListingClient } from "@/components/category/CategoryListingClient"
import { CategoryFiltersClient } from "@/components/category/CategoryFiltersClient"
import { serializePrisma } from "@/lib/serialize"

import { categoryMetadata } from "@/lib/seo"

type Props = {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{
    sort?: "recommended" | "newest" | "bestseller" | "price-asc" | "price-desc" | "discount"
    inStock?: "1"
    onSale?: "1"
    view?: "grid2" | "grid4"
    page?: string
    /** "attrSlug:value,attrSlug2:value2" formatında attribute filtresi */
    attrs?: string
  }>
}

const PAGE_SIZE = 16

/** Kategori listesi DB’den gelsin; build/ISR tamponu “eski site” hissi vermesin. */
export const dynamic = "force-dynamic"

/** Slug global olarak benzersiz; çok segmentli URL'de üst segment ile eşleşmeyi doğrularız. */
async function loadCategoryForPath(slug: string[]) {
  const currentSlug = slug[slug.length - 1]
  if (!currentSlug) return null

  const row = await prisma.category.findUnique({
    where: { slug: currentSlug },
    include: {
      parent: { include: { children: true } },
      children: true,
    },
  })

  if (!row) return null

  if (slug.length > 1) {
    const parentSlug = slug[slug.length - 2]
    const parentRow = await prisma.category.findUnique({ where: { slug: parentSlug } })
    if (!parentRow || row.parentId !== parentRow.id) {
      return null
    }
  }

  return row
}

function slugToTitle(slug: string) {
  if (!slug) return ""
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/** Çok sayfalı listelerde 1 … orta … son şeklinde kısa sayfa listesi. */
function getVisiblePageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) return [1]
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const delta = 2
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)
  const out: (number | "ellipsis")[] = [1]
  if (left > 2) out.push("ellipsis")
  for (let p = left; p <= right; p++) {
    out.push(p)
  }
  if (right < total - 1) out.push("ellipsis")
  out.push(total)
  return out
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await loadCategoryForPath(slug)
  const title = category?.name ?? slugToTitle(slug[slug.length - 1] ?? "")
  const slugPath = slug.join("/")
  return categoryMetadata({
    name: title,
    slugPath,
    description: category?.description,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const currentSlug = slug[slug.length - 1]
  const fullPath = slug.join("/")

  const query = await searchParams
  const page = Math.max(Number(query.page ?? "1"), 1)
  const sort = query.sort ?? "recommended"
  const inStock = query.inStock === "1"
  const onSale = query.onSale === "1"
  const view = query.view ?? "grid4"
  const skip = (page - 1) * PAGE_SIZE

  // Attribute filtreleri: "renk:Gold,beden:M" formatını parse et
  const attrFilters: { slug: string; value: string }[] = []
  if (query.attrs) {
    for (const pair of query.attrs.split(",")) {
      const idx = pair.indexOf(":")
      if (idx > 0) {
        attrFilters.push({ slug: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() })
      }
    }
  }

  const category = await loadCategoryForPath(slug)
  if (!category) {
    notFound()
  }

  // Dropdown'da gösterilecek kategoriler:
  // Eğer alt kategoriysek, kardeşlerimizi (parent.children) göster.
  // Eğer ana kategoriysek, kendi çocuklarımızı (children) göster.
  const dropdownCategories = category?.parent
    ? category.parent.children
    : (category?.children ?? [])

  const isSubCategory = category.parentId !== null
  const where: Prisma.ProductWhereInput = {
    OR: isSubCategory
      ? [
          { subCategoryId: category.id },
          { categories: { some: { categoryId: category.id } } },
        ]
      : [
          { categoryId: category.id },
          { categories: { some: { categoryId: category.id } } },
        ],
    isActive: true,
    ...(inStock ? {
      variants: {
        some: { stock: { gt: 0 }, isActive: true }
      }
    } : {}),
    ...(onSale ? {
      compareAtPrice: { not: null }
    } : {}),
    // Attribute filtresi: her seçilen attr için ProductVariantAttributeValue veya ProductAttributeValue eşleşmesi
    ...(attrFilters.length > 0
      ? {
          AND: attrFilters.map((f) => ({
            OR: [
              {
                variants: {
                  some: {
                    attributeValues: {
                      some: {
                        attribute: { slug: f.slug },
                        value: { value: f.value },
                      },
                    },
                  },
                },
              },
              {
                attributeValues: {
                  some: {
                    attribute: { slug: f.slug },
                    value: { value: f.value },
                  },
                },
              },
            ],
          })),
        }
      : {}),
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ basePrice: "asc" }]
      : sort === "price-desc"
        ? [{ basePrice: "desc" }]
        : sort === "bestseller"
          ? [{ isFeatured: "desc" }, { updatedAt: "desc" }]
          : sort === "discount"
            ? [{ compareAtPrice: "desc" }, { createdAt: "desc" }]
            : sort === "newest"
              ? [{ createdAt: "desc" }]
              : [{ isFeatured: "desc" }, { createdAt: "desc" }]

  // Kategoriye ait filtrelenebilir attribute'ları çek
  // CategoryAttribute tablosu migration gerektirdiğinden tablo yoksa boş dizi döner
  const filterableAttributes = await prisma.categoryAttribute.findMany({
    where: { categoryId: category.id, isFilterable: true },
    include: {
      attribute: {
        include: {
          values: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: { id: true, value: true, slug: true, colorHex: true },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  }).catch(() => [])

  const [dbProducts, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: inStock
          ? {
              where: { stock: { gt: 0 }, isActive: true },
              orderBy: { id: "asc" },
              take: 1,
            }
          : { take: 1 },
      },
    }),
    prisma.product.count({ where })
  ])

  const products = dbProducts
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const currentAttrsStr = attrFilters.map((f) => `${f.slug}:${f.value}`).join(",")

  // URL yardımcısı — sadece Server Component içinde kullanılır (pagination, sort linkleri)
  const buildHref = (overrides: {
    sort?: string; inStock?: boolean; onSale?: boolean
    view?: string; page?: string; attrs?: string
  }) => {
    const newParams = new URLSearchParams()
    const s = overrides.sort !== undefined ? overrides.sort : sort
    const iS = overrides.inStock !== undefined ? overrides.inStock : inStock
    const oS = overrides.onSale !== undefined ? overrides.onSale : onSale
    const v = overrides.view !== undefined ? overrides.view : view
    const p = overrides.page !== undefined ? overrides.page : (page > 1 ? page.toString() : undefined)
    if (s !== "recommended") newParams.set("sort", s)
    if (iS) newParams.set("inStock", "1")
    if (oS) newParams.set("onSale", "1")
    if (v !== "grid4") newParams.set("view", v)
    if (p) newParams.set("page", p)
    if (currentAttrsStr) newParams.set("attrs", currentAttrsStr)
    const qs = newParams.toString()
    return `/categories/${fullPath}${qs ? "?" + qs : ""}`
  }

  return (
    <>
      <HomeHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <nav className="mb-6 flex items-center gap-2 text-[13px] text-zinc-500">
          <Link href="/" className="flex items-center gap-1 hover:text-brand-gold">
            Anasayfa
          </Link>
          <span>&gt;</span>
          {category?.parent && (
            <>
              <Link href={`/categories/${category.parent.slug}`} className="hover:text-brand-gold">
                {category.parent.name}
              </Link>
              <span>&gt;</span>
            </>
          )}
          <span className="font-semibold text-brand-gold uppercase">
            {category?.name ?? slugToTitle(currentSlug)}
          </span>
        </nav>

        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-brand-navy md:text-3xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 max-w-2xl text-sm text-brand-muted">{category.description}</p>
          )}
          <p className="mt-2 text-xs font-medium text-brand-muted">{total} ürün</p>
        </div>

        {dropdownCategories.length > 0 && (
          <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 whitespace-nowrap">
              {dropdownCategories.map(cat => {
                const href = category?.parent
                  ? `/categories/${category.parent.slug}/${cat.slug}`
                  : `/categories/${currentSlug}/${cat.slug}`;
                const isActive = cat.slug === currentSlug;
                return (
                  <Link
                    key={cat.id}
                    href={href}
                    className={`h-10 px-6 flex items-center rounded-full text-sm font-medium transition-all ${isActive ? "bg-brand-gold text-white shadow-lg shadow-brand-gold/20" : "bg-white border border-zinc-200 text-zinc-600 hover:border-brand-gold hover:text-brand-gold"}`}
                  >
                    {cat.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <CategoryFiltersClient
          filterableAttributes={filterableAttributes.map((ca) => ({
            attributeId: ca.attributeId,
            slug: ca.attribute.slug,
            name: ca.attribute.name,
            type: ca.attribute.type,
            values: ca.attribute.values,
          }))}
          activeFilters={attrFilters}
          totalCount={total}
          fullPath={fullPath}
          sort={sort}
          inStock={inStock}
          onSale={onSale}
          view={view}
          currentPage={page}
          currentAttrsStr={currentAttrsStr}
        >
        <div className="mb-8 space-y-4">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-brand-muted">Sırala:</span>
              {(
                [
                  ["recommended", "Önerilen"],
                  ["newest", "Yeni Gelenler"],
                  ["bestseller", "Çok Satanlar"],
                  ["price-asc", "Fiyat Artan"],
                  ["price-desc", "Fiyat Azalan"],
                  ["discount", "İndirim Oranı"],
                ] as const
              ).map(([value, label]) => (
                <Link
                  key={value}
                  href={buildHref({ sort: value, page: "1" })}
                  className={`h-9 px-3 flex items-center rounded-full border text-xs font-medium transition whitespace-nowrap ${
                    sort === value
                      ? "bg-brand-gold border-brand-gold text-white"
                      : "bg-white border-zinc-200 text-zinc-600 hover:border-brand-border hover:text-brand-gold"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link href={buildHref({ view: "grid2" })} title="2'li Görünüm" className="flex gap-1 p-2 group">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${view === "grid2" ? "bg-brand-gold" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${view === "grid2" ? "bg-brand-gold" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
              </Link>
              <Link href={buildHref({ view: "grid4" })} title="4'lü Görünüm" className="flex gap-1 p-2 group">
                <div className={`w-1 h-1 rounded-full transition-colors ${view === "grid4" ? "bg-brand-gold" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
                <div className={`w-1 h-1 rounded-full transition-colors ${view === "grid4" ? "bg-brand-gold" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
                <div className={`w-1 h-1 rounded-full transition-colors ${view === "grid4" ? "bg-brand-gold" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
                <div className={`w-1 h-1 rounded-full transition-colors ${view === "grid4" ? "bg-brand-gold" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
              </Link>
            </div>
          </div>
        </div>

        <CategoryListingClient products={serializePrisma(products) as unknown as Parameters<typeof CategoryListingClient>[0]["products"]} view={view as Parameters<typeof CategoryListingClient>[0]["view"]} />

        {totalPages > 1 && (
          <nav
            className="mt-16 flex flex-wrap items-center justify-center gap-1 sm:gap-2"
            aria-label="Sayfa navigasyonu"
          >
            {page > 1 ? (
              <Link
                href={buildHref({ page: (page - 1).toString() })}
                className="flex h-10 min-w-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition hover:border-brand-gold hover:text-brand-gold"
              >
                Önceki
              </Link>
            ) : (
              <span className="flex h-10 min-w-10 cursor-not-allowed items-center justify-center rounded-md border border-zinc-100 bg-zinc-50 px-3 text-sm font-medium text-zinc-300">
                Önceki
              </span>
            )}
            {getVisiblePageNumbers(page, totalPages).map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`e-${idx}`}
                  className="flex h-10 w-10 items-center justify-center text-sm text-zinc-400"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  href={buildHref({ page: item.toString() })}
                  aria-current={page === item ? "page" : undefined}
                  className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition ${page === item ? "border-brand-gold bg-brand-gold text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-brand-gold hover:text-brand-gold"}`}
                >
                  {item}
                </Link>
              )
            )}
            {page < totalPages ? (
              <Link
                href={buildHref({ page: (page + 1).toString() })}
                className="flex h-10 min-w-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition hover:border-brand-gold hover:text-brand-gold"
              >
                Sonraki
              </Link>
            ) : (
              <span className="flex h-10 min-w-10 cursor-not-allowed items-center justify-center rounded-md border border-zinc-100 bg-zinc-50 px-3 text-sm font-medium text-zinc-300">
                Sonraki
              </span>
            )}
          </nav>
        )}
        </CategoryFiltersClient>
      </main>

      <HomeFooter />
    </>
  )
}
