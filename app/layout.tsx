import type { Metadata } from "next"
import { DM_Sans, Playfair_Display } from "next/font/google"
import "./globals.css"
import { prisma } from "@/lib/prisma"
import { getSiteBrandingSettings, siteKeywordsToArray, FALLBACK_BRANDING } from "@/lib/siteSettings"
import { BRAND_SITE_URL } from "@/lib/brand"
import { isIndexingAllowed } from "@/lib/indexing"
import { publicPageRobots } from "@/lib/seo"
import { JsonLd } from "@/components/seo/JsonLd"
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonLd"
import { SiteProviders } from "@/components/consent/SiteProviders"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? BRAND_SITE_URL

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getSiteBrandingSettings(prisma).catch(() => FALLBACK_BRANDING)
  const keywords = siteKeywordsToArray(branding.metaKeywordsRaw)

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: branding.titleDefault,
      template: branding.titleTemplate,
    },
    description: branding.metaDescription,
    keywords,
    authors: [{ name: branding.ogSiteName }],
    creator: branding.ogSiteName,
    publisher: branding.ogSiteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [{ url: "/logo.png", type: "image/png", sizes: "any" }],
      shortcut: "/logo.png",
      apple: "/logo.png",
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: siteUrl,
      siteName: branding.ogSiteName,
      title: branding.titleDefault,
      description: branding.metaDescription,
      images: [
        {
          url: branding.ogImageUrl,
          width: 1200,
          height: 630,
          alt: branding.titleDefault,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: branding.titleDefault,
      description: branding.metaDescription,
      images: [branding.ogImageUrl],
    },
    robots: publicPageRobots(),
    alternates: {
      canonical: siteUrl,
    },
    manifest: "/manifest.webmanifest",

    category: "shopping",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? BRAND_SITE_URL
  const indexAllowed = isIndexingAllowed()

  return (
    <html
      lang="tr"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        {!indexAllowed && <meta name="robots" content="noindex,nofollow" />}
        <JsonLd data={[organizationJsonLd(siteUrl), websiteJsonLd(siteUrl)]} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteProviders>{children}</SiteProviders>
      </body>
    </html>
  )
}
