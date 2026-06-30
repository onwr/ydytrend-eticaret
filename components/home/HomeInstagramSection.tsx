"use client"

import Link from "next/link"
import { FaInstagram } from "react-icons/fa"
import { BRAND_INSTAGRAM, BRAND_NAME } from "@/lib/brand"

export function HomeInstagramSection() {
  return (
    <section className="py-6 md:py-8">
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-brand-blush-soft via-white to-brand-page p-8 text-center md:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-white">
          <FaInstagram className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="mt-5 font-display text-xl font-semibold text-brand-navy md:text-2xl">
          @{BRAND_NAME.replace(/\s/g, "").toLowerCase()} Instagram
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">
          Yeni koleksiyonlar, stil önerileri ve kampanyalar için bizi Instagram&apos;da takip edin.
        </p>
        <Link
          href={BRAND_INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-gold"
        >
          Instagram&apos;da Takip Et
        </Link>
      </div>
    </section>
  )
}
