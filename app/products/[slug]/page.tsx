import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ProductDetailClient } from "@/components/product/ProductDetailClient"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import { JsonLd } from "@/components/seo/JsonLd"
import { prisma } from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"
import { mapApiProductToDetailViewModel } from "@/lib/productDetailShape"
import { productMetadata, absoluteUrl } from "@/lib/seo"
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonLd"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      name: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  })

  if (!product) {
    return { title: "Ürün Bulunamadı", robots: { index: false, follow: false } }
  }

  return productMetadata({
    name: product.name,
    slug,
    description: product.description,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    imageUrl: product.images[0]?.url ?? null,
  })
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  // attributeValues migration henüz uygulanmadıysa include olmadan dene
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        where: { isActive: true },
        include: {
          attributeValues: {
            include: {
              attribute: { select: { id: true, name: true, slug: true, type: true } },
              value: { select: { id: true, value: true, slug: true, colorHex: true } },
            },
          },
        },
      },
    },
  }).catch(() =>
    prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
      },
    })
  )

  if (!product) {
    notFound()
  }

  const serializedProduct = serializePrisma(product) as Parameters<typeof mapApiProductToDetailViewModel>[0]
  const extraCategories = (product.categories ?? [])
    .map((row) => row.category)
    .filter((c) => c && c.slug !== product.category?.slug)
  const productViewModel = mapApiProductToDetailViewModel(serializedProduct, {
    extraCategories: extraCategories.map((c) => ({ name: c.name, slug: c.slug })),
  })

  const productUrl = absoluteUrl(`/products/${slug}`)
  const imageUrls = product.images.map((img) =>
    img.url.startsWith("http") ? img.url : absoluteUrl(img.url)
  )
  const defaultVariant = product.variants[0]
  const price = defaultVariant ? Number(defaultVariant.price) : Number(product.basePrice)
  const inStock = product.variants.some((v) => v.stock > 0)

  const crumbs = [
    { name: "Anasayfa", url: absoluteUrl("/") },
    ...(product.category
      ? [{ name: product.category.name, url: absoluteUrl(`/categories/${product.category.slug}`) }]
      : []),
    { name: product.name, url: productUrl },
  ]

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          productJsonLd({
            name: product.name,
            description: product.metaDescription ?? product.shortDescription,
            url: productUrl,
            sku: defaultVariant?.sku ?? product.sku,
            imageUrls,
            price,
            inStock,
          }),
        ]}
      />
      <main className="mx-auto w-full">
        <HomeHeader />

        <div className="max-w-screen-2xl mx-auto">
          <div className="my-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-zinc-500">
              <Link href="/" className="transition hover:text-brand-gold">
                Anasayfa
              </Link>
              <span aria-hidden>›</span>
              {product.category && (
                <>
                  <Link
                    href={`/categories/${product.category.slug}`}
                    className="transition hover:text-brand-gold"
                  >
                    {product.category.name}
                  </Link>
                  <span aria-hidden>›</span>
                </>
              )}
              <span className="font-medium text-zinc-800">{product.name}</span>
            </div>

            <Link href="/" className="text-zinc-500 transition hover:text-brand-gold">
              &lt; &lt; Anasayfaya Dön
            </Link>
          </div>

          <ProductDetailClient product={productViewModel} />
        </div>
      </main>
      <HomeFooter />
    </>
  )
}
