import type { MetadataRoute } from "next"
import { isIndexingAllowed } from "@/lib/indexing"
import { absoluteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const allowIndex = isIndexingAllowed()

  if (!allowIndex) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/checkout",
          "/checkout/",
          "/cart",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/profil",
          "/profil/",
          "/siparislerim",
          "/siparislerim/",
          "/search",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
