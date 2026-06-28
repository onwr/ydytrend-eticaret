import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { absoluteUrl } from "@/lib/seo"
import { isIndexingAllowed } from "@/lib/indexing"

const STATIC_PAGES = [
  { loc: "/", priority: 1.0, changefreq: "daily" as const },
  { loc: "/sikca-sorulan-sorular", priority: 0.5, changefreq: "monthly" as const },
  { loc: "/sayfa/hakkimizda", priority: 0.4, changefreq: "monthly" as const },
  { loc: "/sayfa/gizlilik-ve-guvenlik", priority: 0.3, changefreq: "monthly" as const },
  { loc: "/sayfa/mesafeli-satis-sozlesmesi", priority: 0.3, changefreq: "monthly" as const },
  { loc: "/sayfa/iade-proseduru", priority: 0.3, changefreq: "monthly" as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingAllowed()) {
    return []
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: absoluteUrl(p.loc),
    lastModified: new Date(),
    changeFrequency: p.changefreq,
    priority: p.priority,
  }))

  let categoryEntries: MetadataRoute.Sitemap = []
  let productEntries: MetadataRoute.Sitemap = []

  try {
    const categories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true, parent: { select: { slug: true } } },
    })
    categoryEntries = categories.map((c) => {
      const path = c.parent ? `/categories/${c.parent.slug}/${c.slug}` : `/categories/${c.slug}`
      return {
        url: absoluteUrl(path),
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }
    })
  } catch {
    /* DB hatasında kategoriler atlanır */
  }

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })
    productEntries = products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  } catch {
    /* DB hatasında ürünler atlanır */
  }

  return [...staticEntries, ...categoryEntries, ...productEntries]
}
