import type { Metadata } from "next"
import { BRAND_SITE_URL } from "@/lib/brand"
import { isIndexingAllowed } from "@/lib/indexing"

export function absoluteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? BRAND_SITE_URL).replace(/\/$/, "")
  if (!path || path === "/") return base
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export function canonicalMetadata(path: string): Metadata["alternates"] {
  return { canonical: absoluteUrl(path) }
}

/** Hesap, checkout, arama vb. — indexlenmemeli. */
export function privatePageMetadata(opts: {
  title: string
  description?: string
  path?: string
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    ...(opts.path ? { alternates: canonicalMetadata(opts.path) } : {}),
  }
}

export function publicPageRobots(): Metadata["robots"] {
  if (!isIndexingAllowed()) {
    return { index: false, follow: false, googleBot: { index: false, follow: false } }
  }
  return { index: true, follow: true }
}

export function productMetadata(input: {
  name: string
  slug: string
  description?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  imageUrl?: string | null
}): Metadata {
  const title = input.metaTitle?.trim() || input.name
  const description =
    input.metaDescription?.trim() ||
    input.description?.slice(0, 160) ||
    `${input.name} — YDY Trend moda aksesuar koleksiyonu.`
  const url = absoluteUrl(`/products/${input.slug}`)
  const image = input.imageUrl?.startsWith("http")
    ? input.imageUrl
    : input.imageUrl
      ? absoluteUrl(input.imageUrl)
      : absoluteUrl("/logo.png")

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: publicPageRobots(),
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: input.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

export function categoryMetadata(input: {
  name: string
  slugPath: string
  description?: string | null
}): Metadata {
  const title = input.name
  const description =
    input.description?.slice(0, 160) ||
    `${input.name} kategorisinde takı, çanta ve moda aksesuarları — YDY Trend.`
  const url = absoluteUrl(`/categories/${input.slugPath}`)

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: publicPageRobots(),
    openGraph: { type: "website", url, title, description },
    twitter: { card: "summary", title, description },
  }
}
