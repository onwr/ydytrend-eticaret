import type { Metadata } from "next"
import { privatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = privatePageMetadata({
  title: "Hesabım",
  description: "Profil, adresler, siparişler ve favorileriniz.",
  path: "/profil",
})

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return children
}
