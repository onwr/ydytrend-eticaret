"use client"

import Image from "next/image"
import Link from "next/link"
import { FaChevronRight } from "react-icons/fa"
import { motion } from "framer-motion"
import type { HomeCategoryItem } from "@/lib/homepageCategories"

const FALLBACK_IMAGES: Record<string, string> = {
  taki: "/urunler/urun1.jpg",
  canta: "/urunler/urun3.jpg",
  sapka: "/urunler/urun4.jpg",
  aksesuar: "/urunler/urun5.jpg",
}

const FALLBACK_COPY: Record<string, string> = {
  taki: "Zarif takılarla stilini tamamla",
  canta: "Günün her anına eşlik eden çantalar",
  sapka: "Sezonun en trend şapkaları",
  aksesuar: "Detaylarla fark yarat",
}

function pickFeatured(categories: HomeCategoryItem[]): HomeCategoryItem[] {
  const priority = ["taki", "canta", "sapka", "aksesuar"]
  const picked: HomeCategoryItem[] = []
  for (const slug of priority) {
    const found = categories.find((c) => c.slug === slug)
    if (found) picked.push(found)
  }
  if (picked.length >= 4) return picked.slice(0, 4)
  for (const c of categories) {
    if (!picked.some((p) => p.id === c.id)) picked.push(c)
    if (picked.length >= 4) break
  }
  return picked.slice(0, 4)
}

export function PopularCategories({ categories }: { categories: HomeCategoryItem[] }) {
  if (categories.length === 0) return null

  const featured = pickFeatured(categories)

  return (
    <section className="py-5 md:py-7">
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <div>
          <h2 className="font-display text-xl font-semibold text-brand-navy md:text-2xl">
            Kategorileri Keşfet
          </h2>
          <p className="mt-1 text-sm text-brand-muted">
            Takı, çanta, şapka ve moda aksesuarları
          </p>
        </div>
        <Link
          href="/categories"
          className="hidden items-center gap-1 text-sm font-medium text-brand-gold hover:text-brand-navy sm:flex"
        >
          Tümünü Gör <FaChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Desktop: 2x2 grid of large lifestyle cards */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((cat, idx) => {
          const href = cat.parentSlug
            ? `/categories/${cat.parentSlug}/${cat.slug}`
            : `/categories/${cat.slug}`
          const image = cat.imageUrl ?? FALLBACK_IMAGES[cat.slug] ?? "/logo.png"
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
            >
              <Link
                href={href}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-brand-border shadow-[0_4px_20px_rgba(35,32,32,0.06)]"
              >
                <Image
                  src={image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-brand-navy/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-lg font-semibold text-white">{cat.name}</h3>
                  <p className="mt-1 text-xs text-white/80">
                    {FALLBACK_COPY[cat.slug] ?? "Koleksiyonu keşfet"}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-soft opacity-0 transition-opacity group-hover:opacity-100">
                    Alışverişe Başla <FaChevronRight className="h-2.5 w-2.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
        {featured.map((cat) => {
          const href = cat.parentSlug
            ? `/categories/${cat.parentSlug}/${cat.slug}`
            : `/categories/${cat.slug}`
          const image = cat.imageUrl ?? FALLBACK_IMAGES[cat.slug] ?? "/logo.png"
          return (
            <Link
              key={cat.id}
              href={href}
              className="relative h-52 w-40 shrink-0 overflow-hidden rounded-2xl border border-brand-border"
            >
              <Image src={image} alt={cat.name} fill sizes="160px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/85 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white">
                {cat.name}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
