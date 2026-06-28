"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import type { HomeBrandItem } from "@/lib/homepageCategories"

export function BrandSelector({ brands }: { brands: HomeBrandItem[] }) {
  if (brands.length === 0) return null

  return (
    <section className="py-8 md:py-10">
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl font-bold text-brand-text md:text-2xl">Markaya Göre Parça Bul</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Cihazınızın markasını seçin, uyumlu yedek parçalara kolayca ulaşın.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
        {brands.map((brand, idx) => (
          <motion.div
            key={brand.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.03 }}
          >
            <Link
              href={brand.href}
              className="group flex h-full min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-brand-border bg-brand-card px-4 py-4 text-center shadow-[0_2px_12px_rgba(8,42,85,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-teal/40 hover:shadow-[0_8px_24px_rgba(8,42,85,0.08)] focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            >
              {brand.imageUrl ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                  <Image
                    src={brand.imageUrl}
                    alt={brand.name}
                    fill
                    className="object-contain"
                    sizes="32px"
                  />
                </div>
              ) : null}
              <span className="text-[13px] font-bold text-brand-navy transition-colors group-hover:text-brand-teal md:text-sm">
                {brand.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
