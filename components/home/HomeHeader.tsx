"use client"

import Image from "next/image"
import Link from "next/link"
import { FaSearch, FaShoppingBag, FaHeart } from "react-icons/fa"
import { useState, useEffect, useCallback } from "react"
import { AnnouncementBar } from "@/components/home/AnnouncementBar"
import { SearchBar } from "@/components/home/SearchBar"
import { DesktopNavigation, type HeaderNavLink } from "@/components/home/DesktopNavigation"
import { MobileNavigation, MobileMenuButton } from "@/components/home/MobileNavigation"
import { HeaderAuthNav } from "@/components/home/HeaderAuthNav"
import { HeaderCartCount } from "@/components/home/HeaderCartCount"
import { CartDrawer } from "@/components/cart/CartDrawer"
import { BRAND_LOGO_ACTIVE_PATH } from "@/lib/brand"

export function HomeHeader() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<number | null>(null)
  const [navItems, setNavItems] = useState<HeaderNavLink[]>([])
  const [navLoading, setNavLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadNav = async () => {
      try {
        const res = await fetch("/api/navigation")
        const data = await res.json()
        if (!cancelled && Array.isArray(data?.items)) {
          setNavItems(data.items)
        }
      } catch {
        if (!cancelled) setNavItems([])
      } finally {
        if (!cancelled) setNavLoading(false)
      }
    }
    void loadNav()
    return () => {
      cancelled = true
    }
  }, [])

  const handleMenuEnter = useCallback((id: number) => setActiveMenu(id), [])
  const handleMenuLeave = useCallback(() => setActiveMenu(null), [])
  const handleToggleMenu = useCallback((id: number) => {
    setActiveMenu((prev) => (prev === id ? null : id))
  }, [])

  return (
    <>
      <div className="sticky top-0 z-50 w-full overflow-visible">
        <AnnouncementBar />

        <header
          className={`w-full overflow-visible border-b border-brand-border bg-white transition-shadow duration-300 ${
            scrolled ? "shadow-[0_2px_20px_rgba(35,32,32,0.06)]" : ""
          }`}
        >
          <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
            <div className="flex items-center gap-3 py-3 md:gap-6 md:py-4">
              <MobileMenuButton
                isOpen={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((v) => !v)}
              />

              <Link href="/" className="shrink-0 py-1">
                <Image
                  src={BRAND_LOGO_ACTIVE_PATH}
                  alt="YDY Trend"
                  width={200}
                  height={72}
                  priority
                  className="h-auto w-[90px] object-contain sm:w-[115px] md:w-[155px]"
                  sizes="(max-width: 640px) 90px, (max-width: 768px) 115px, 155px"
                />
              </Link>

              <div className="hidden min-w-0 flex-1 md:block">
                <SearchBar />
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={() => setShowMobileSearch((v) => !v)}
                  aria-label="Ara"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border text-brand-navy transition hover:border-brand-teal hover:text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 md:hidden"
                >
                  <FaSearch className="h-4 w-4" />
                </button>

                <Link
                  href="/profil?tab=favoriler"
                  aria-label="Favorilerim"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border text-brand-navy transition hover:border-brand-gold hover:text-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                >
                  <FaHeart className="h-4 w-4" />
                </Link>

                <HeaderAuthNav />

                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="group relative flex items-center gap-2 rounded-xl border border-brand-border bg-brand-page px-3 py-2 transition-all duration-200 hover:border-brand-teal hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30 md:px-4"
                >
                  <FaShoppingBag className="h-4 w-4 text-brand-teal" aria-hidden />
                  <div className="hidden flex-col items-start leading-tight md:flex">
                    <span className="text-[10px] font-medium text-brand-muted">Sepetim</span>
                    <HeaderCartCount showTotal />
                  </div>
                  <span className="relative md:hidden">
                    <HeaderCartCount badgeOnly />
                  </span>
                </button>
              </div>
            </div>
          </div>

          <MobileNavigation
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            navItems={navItems}
            showMobileSearch={showMobileSearch}
            onToggleMobileSearch={() => setShowMobileSearch(false)}
          />

          <DesktopNavigation
            navItems={navItems}
            navLoading={navLoading}
            activeMenu={activeMenu}
            onMenuEnter={handleMenuEnter}
            onMenuLeave={handleMenuLeave}
            onToggleMenu={handleToggleMenu}
          />
        </header>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}

/** @deprecated Use HomeHeader — alias for MainHeader naming in specs */
export const MainHeader = HomeHeader
