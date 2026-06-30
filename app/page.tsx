import type { Metadata } from "next"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import { HomeProductsSection } from "@/components/home/HomeProductsSection"
import { HomeFaqSection } from "@/components/home/HomeFaqSection"
import { HeroSection } from "@/components/home/HeroSection"
import { PopularCategories } from "@/components/home/PopularCategories"
import { TrustFeatures } from "@/components/home/TrustFeatures"
import { HomeInstagramSection } from "@/components/home/HomeInstagramSection"
import { HomeNewsletter } from "@/components/home/HomeNewsletter"
import type { ProductCardData } from "@/components/product/ProductCard"
import { normalizeHeroSlide } from "@/lib/heroContent"
import {
  getPopularHomeCategories,
  getFooterCategories,
} from "@/lib/homepageCategories"
import { prisma } from "@/lib/prisma"
import { BRAND_NAME, BRAND_SEO_DESCRIPTION } from "@/lib/brand"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Takı, Çanta, Şapka ve Moda Aksesuarları`,
  description: BRAND_SEO_DESCRIPTION,
}

const productInclude = {
  images: true,
  category: { select: { name: true } },
  variants: { where: { isActive: true }, select: { stock: true, price: true } },
} as const

type DbProduct = Awaited<
  ReturnType<
    typeof prisma.product.findMany<{ include: typeof productInclude }>
  >
>[number]

function serializeProduct(p: DbProduct, opts?: { isBestseller?: boolean }): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    basePrice: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
    category: p.category ?? undefined,
    images: p.images.map((img) => ({ url: img.url, isCover: img.isCover })),
    variants: p.variants.map((v) => ({ stock: v.stock, price: Number(v.price) })),
    isNew:
      Date.now() - new Date(p.createdAt).getTime() < 1000 * 60 * 60 * 24 * 30,
    isBestseller: opts?.isBestseller,
  }
}

export default async function HomePage() {
  const [
    slidersDb,
    popularCategories,
    footerCategories,
    bestSellingDb,
    newProductsDb,
    discountedCandidatesDb,
    featuredDb,
    faqsDb,
    homeSectionsDb,
  ] = await Promise.all([
    prisma.slider.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getPopularHomeCategories(prisma),
    getFooterCategories(prisma),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.product.findMany({
      where: { isActive: true, compareAtPrice: { not: null } },
      include: productInclude,
      orderBy: { updatedAt: "desc" },
      take: 24,
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 12,
      skip: 12,
    }),
    prisma.faq.findMany({
      where: { isActive: true, showOnHome: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.homeProductSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { category: true },
    }),
  ])

  const heroSlides = slidersDb.map((s) => normalizeHeroSlide(s))

  const bestSelling = bestSellingDb.map((p) => serializeProduct(p, { isBestseller: true }))
  const newProducts = newProductsDb.map((p) => serializeProduct(p))
  const discountedProducts = discountedCandidatesDb
    .filter((p) => p.compareAtPrice && Number(p.compareAtPrice) < Number(p.basePrice))
    .slice(0, 12)
    .map((p) => serializeProduct(p))

  const featuredProducts = featuredDb.map((p) => serializeProduct(p))

  const faqs = faqsDb.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }))

  const homeSections = await Promise.all(
    homeSectionsDb.map(async (section) => {
      let sectionProducts: ProductCardData[] = []

      if (section.type === "CATEGORY" && section.categoryId) {
        const dbProds = await prisma.product.findMany({
          where: {
            isActive: true,
            OR: [
              { categoryId: section.categoryId },
              { subCategoryId: section.categoryId },
              { categories: { some: { categoryId: section.categoryId } } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          include: productInclude,
        })
        sectionProducts = dbProds.map((p) => serializeProduct(p))
      } else if (section.type === "PRODUCT_LIST" && section.productsJson) {
        try {
          const ids = JSON.parse(section.productsJson) as number[]
          const dbProds = await prisma.product.findMany({
            where: { id: { in: ids }, isActive: true },
            include: productInclude,
          })
          const byId = new Map(dbProds.map((p) => [p.id, p]))
          sectionProducts = ids
            .map((id) => byId.get(id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .map((p) => serializeProduct(p))
        } catch {
          /* geçersiz json */
        }
      }

      return {
        id: section.id,
        title: section.title,
        subtitle: section.subtitle,
        products: sectionProducts,
      }
    })
  )

  return (
    <>
      <HomeHeader />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 md:px-6 lg:px-8">
        <div className="py-3 md:py-4">
          <HeroSection slides={heroSlides} />
        </div>

        <TrustFeatures />

        <PopularCategories categories={popularCategories} />

        <HomeProductsSection
          title="Yeni Gelenler"
          subtitle="Sezonun en yeni parçaları"
          products={newProducts}
          viewAllHref="/search?sort=newest"
        />

        <HomeProductsSection
          title="Çok Satanlar"
          subtitle="En çok tercih edilen ürünler"
          products={bestSelling}
          viewAllHref="/search?sort=popular"
        />

        <HomeProductsSection title="İndirimde" products={discountedProducts} viewAllHref="/search?indirim=true" />

        {featuredProducts.length > 0 && (
          <HomeProductsSection
            title="Sezon Koleksiyonu"
            subtitle="Öne çıkan seçkiler"
            products={featuredProducts}
          />
        )}

        {homeSections.map((section) => (
          <HomeProductsSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle || undefined}
            products={section.products}
          />
        ))}

        <HomeInstagramSection />

        <HomeNewsletter />

        <HomeFaqSection items={faqs} />
      </main>
      <HomeFooter categoryLinks={footerCategories} />
    </>
  )
}
