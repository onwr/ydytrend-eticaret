import type { PrismaClient } from "@/generated/prisma/client"

export type HomeCategoryItem = {
  id: number
  name: string
  slug: string
  imageUrl: string | null
  parentSlug?: string | null
}

export type HomeBrandItem = {
  id: number
  name: string
  slug: string
  imageUrl: string | null
  href: string
}

export type DeviceFinderBrand = {
  name: string
  slug: string
  models: { name: string; slug: string }[]
}

export type DeviceFinderData = {
  brands: DeviceFinderBrand[]
  partTypes: { name: string; slug: string }[]
}

const BRAND_PARENT_SLUGS = [
  "telefon-yedek-parca",
  "markalar",
  "telefon-markalari",
  "phone-brands",
]

const PART_TYPE_PARENT_SLUGS = [
  "parca-turleri",
  "parca-tipleri",
  "yedek-parca-turleri",
]

function categoryHref(cat: { slug: string; parent?: { slug: string } | null }) {
  if (cat.parent?.slug) {
    return `/categories/${cat.parent.slug}/${cat.slug}`
  }
  return `/categories/${cat.slug}`
}

/** Admin panelinde "Anasayfada göster" işaretli kategoriler; boşsa kök kategoriler */
export async function getPopularHomeCategories(
  prisma: Pick<PrismaClient, "category">
): Promise<HomeCategoryItem[]> {
  const featured = await prisma.category.findMany({
    where: { showOnHome: true },
    orderBy: { sortOrder: "asc" },
    include: { parent: { select: { slug: true } } },
  })

  if (featured.length > 0) {
    return featured.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      parentSlug: c.parent?.slug ?? null,
    }))
  }

  const roots = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 8,
  })

  return roots.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    parentSlug: null,
  }))
}

/** Telefon yedek parça altındaki marka kategorileri */
export async function getHomeBrandCategories(
  prisma: Pick<PrismaClient, "category">
): Promise<HomeBrandItem[]> {
  const brandParent = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: { in: BRAND_PARENT_SLUGS } },
        { name: { contains: "marka" } },
        { slug: { contains: "marka" } },
      ],
    },
    include: {
      children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      parent: { select: { slug: true } },
    },
  })

  if (brandParent?.children.length) {
    return brandParent.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      imageUrl: child.imageUrl,
      href: categoryHref({ slug: child.slug, parent: brandParent }),
    }))
  }

  const rootBrands = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 10,
  })

  if (rootBrands.length >= 3) {
    return rootBrands.slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      href: `/categories/${c.slug}`,
    }))
  }

  return []
}

/** Cihaz bulucu: marka → model → parça türü hiyerarşisi */
export async function getDeviceFinderData(
  prisma: Pick<PrismaClient, "category">
): Promise<DeviceFinderData> {
  const brandParent = await prisma.category.findFirst({
    where: {
      OR: [{ slug: { in: BRAND_PARENT_SLUGS } }, { slug: "telefon-yedek-parca" }],
    },
    include: {
      children: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        },
      },
    },
  })

  const brands: DeviceFinderBrand[] =
    brandParent?.children.map((brand) => ({
      name: brand.name,
      slug: brand.slug,
      models: brand.children.map((model) => ({
        name: model.name,
        slug: model.slug,
      })),
    })) ?? []

  const partTypeParent = await prisma.category.findFirst({
    where: {
      OR: PART_TYPE_PARENT_SLUGS.map((slug) => ({ slug })),
    },
    include: {
      children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  })

  let partTypes =
    partTypeParent?.children.map((c) => ({ name: c.name, slug: c.slug })) ?? []

  if (partTypes.length === 0) {
    const homeParts = await prisma.category.findMany({
      where: { showOnHome: true },
      orderBy: { sortOrder: "asc" },
      take: 13,
    })
    partTypes = homeParts.map((c) => ({ name: c.name, slug: c.slug }))
  }

  if (partTypes.length === 0) {
    const roots = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 13,
    })
    partTypes = roots.map((c) => ({ name: c.name, slug: c.slug }))
  }

  return { brands, partTypes }
}

/** Footer kategori linkleri */
export async function getFooterCategories(
  prisma: Pick<PrismaClient, "category">
): Promise<HomeCategoryItem[]> {
  const items = await getPopularHomeCategories(prisma)
  return items.slice(0, 6)
}
