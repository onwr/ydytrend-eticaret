"use client"

import { FaTruck, FaShieldAlt, FaUndo, FaStar } from "react-icons/fa"

const DESKTOP_ITEMS = [
  { icon: FaTruck, text: "750 TL Üzeri Ücretsiz Kargo" },
  { icon: FaShieldAlt, text: "Güvenli Ödeme" },
  { icon: FaUndo, text: "Kolay İade & Değişim" },
  { icon: FaStar, text: "Yeni Sezon Ürünler" },
] as const

export function AnnouncementBar() {
  return (
    <div className="bg-brand-navy text-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center px-4 py-2">
        <p className="flex items-center gap-2 text-[11px] font-medium tracking-wide md:hidden">
          <FaTruck className="h-3 w-3 shrink-0 text-brand-gold-soft" aria-hidden />
          750 TL Üzeri Ücretsiz Kargo
        </p>

        <ul className="hidden w-full items-center justify-center gap-6 md:flex lg:gap-10">
          {DESKTOP_ITEMS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-white/95">
              <Icon className="h-3 w-3 shrink-0 text-brand-gold-soft" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
