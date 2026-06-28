import type { MetadataRoute } from "next"
import { BRAND_NAME, BRAND_DESCRIPTION } from "@/lib/brand"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FCF9F8",
    theme_color: "#B9914B",
    lang: "tr",
    icons: [
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  }
}
