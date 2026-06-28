"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  FaTimes,
  FaBars,
  FaChevronDown,
  FaHeart,
  FaUser,
  FaBox,
  FaInstagram,
} from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { FALLBACK_HEADER_NAV, FALLBACK_SPARE_PARTS_NAV } from "@/lib/sparePartsConfig"
import type { HeaderNavLink } from "@/components/home/DesktopNavigation"
import { SearchBar } from "@/components/home/SearchBar"
import { BRAND_INSTAGRAM } from "@/lib/brand"

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
  navItems: HeaderNavLink[]
  showMobileSearch: boolean
  onToggleMobileSearch: () => void
}

const FALLBACK = FALLBACK_HEADER_NAV.length > 0 ? FALLBACK_HEADER_NAV : FALLBACK_SPARE_PARTS_NAV

function toDisplayItems(items: HeaderNavLink[]): HeaderNavLink[] {
  if (items.length > 0) return items
  return FALLBACK.map((item, i) => ({
    id: -(i + 1),
    label: item.label,
    href: item.href,
    labelUppercase: item.labelUppercase ?? false,
    openInNewTab: false,
    children: item.children,
  }))
}

const EXTRA_LINKS = [
  { label: "Hesabım", href: "/profil", icon: FaUser },
  { label: "Siparişlerim", href: "/siparislerim", icon: FaBox },
  { label: "Favorilerim", href: "/profil?tab=favoriler", icon: FaHeart },
]

export function MobileNavigation({
  isOpen,
  onClose,
  navItems,
  showMobileSearch,
  onToggleMobileSearch,
}: MobileNavigationProps) {
  const displayItems = toDisplayItems(navItems)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [isOpen, onClose])

  return (
    <>
      {showMobileSearch && (
        <div className="border-b border-brand-border bg-white px-4 py-3 md:hidden">
          <SearchBar onNavigate={onToggleMobileSearch} />
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/40 md:hidden"
              onClick={onClose}
              aria-hidden
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label="Mobil menü"
              className="fixed inset-y-0 left-0 z-70 flex w-[min(100%,320px)] flex-col bg-white shadow-xl md:hidden"
            >
              <div className="flex items-center justify-between border-b border-brand-border px-4 py-4">
                <span className="font-display text-base font-semibold text-brand-navy">Menü</span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Menüyü kapat"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-muted hover:bg-brand-page focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobil kategoriler">
                <ul className="space-y-1">
                  {displayItems.map((item) => {
                    const hasChildren = (item.children?.length ?? 0) > 0
                    const isExpanded = expandedId === item.id
                    return (
                      <li key={item.id}>
                        <div className="flex items-center">
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className="flex min-h-[48px] flex-1 items-center rounded-xl px-3 text-[15px] font-medium text-brand-text hover:bg-brand-page"
                          >
                            {item.label}
                          </Link>
                          {hasChildren && (
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-label={`${item.label} alt menüsü`}
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-muted hover:bg-brand-page"
                            >
                              <FaChevronDown
                                className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>
                          )}
                        </div>
                        <AnimatePresence>
                          {hasChildren && isExpanded && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="ml-3 overflow-hidden border-l border-brand-border pl-3"
                            >
                              {item.children!.map((child) => (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    onClick={onClose}
                                    className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-brand-muted hover:text-brand-gold"
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </li>
                    )
                  })}
                </ul>

                <div className="my-4 border-t border-brand-border pt-4">
                  <ul className="space-y-1">
                    {EXTRA_LINKS.map(({ label, href, icon: Icon }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={onClose}
                          className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-brand-text hover:bg-brand-page"
                        >
                          <Icon className="h-4 w-4 text-brand-gold" />
                          {label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <a
                        href={BRAND_INSTAGRAM}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-brand-text hover:bg-brand-page"
                      >
                        <FaInstagram className="h-4 w-4 text-brand-gold" />
                        Instagram
                      </a>
                    </li>
                  </ul>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function MobileMenuButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
      aria-expanded={isOpen}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border text-brand-navy transition hover:border-brand-gold hover:text-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 md:hidden"
    >
      {isOpen ? <FaTimes className="h-4 w-4" /> : <FaBars className="h-4 w-4" />}
    </button>
  )
}
