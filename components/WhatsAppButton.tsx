"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { FaWhatsapp } from "react-icons/fa"
import { BRAND_WHATSAPP } from "@/lib/brand"

const HIDDEN_PREFIXES = ["/checkout", "/admin"]

export function WhatsAppButton() {
  const pathname = usePathname()
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/phone-order")
      .then((r) => r.json())
      .then((d: { whatsappNumber?: string }) => {
        if (cancelled) return
        const num = typeof d.whatsappNumber === "string" ? d.whatsappNumber.trim() : ""
        setWhatsappNumber(num || BRAND_WHATSAPP || null)
      })
      .catch(() => {
        if (!cancelled) setWhatsappNumber(BRAND_WHATSAPP || null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!whatsappNumber) return null
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null

  const message = encodeURIComponent(
    "Merhaba, YDY Trend hakkında bilgi almak istiyorum."
  )

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      title="WhatsApp Destek"
      className="fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 sm:right-5 sm:h-14 sm:w-14"
      style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      aria-label="WhatsApp Destek"
    >
      <FaWhatsapp className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  )
}
