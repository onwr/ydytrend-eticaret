"use client"

import Link from "next/link"
import { FaChevronDown, FaChevronRight, FaThLarge } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { FALLBACK_SPARE_PARTS_NAV } from "@/lib/sparePartsConfig"

export type HeaderNavLink = {
  id: number
  label: string
  href: string
  labelUppercase: boolean
  openInNewTab: boolean
  children?: Array<{
    label: string
    href: string
    openInNewTab?: boolean
  }>
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
}

const megaMenuVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: "anticipate" as const },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
}

interface DesktopNavigationProps {
  navItems: HeaderNavLink[]
  navLoading: boolean
  activeMenu: number | null
  onMenuEnter: (id: number) => void
  onMenuLeave: () => void
  onToggleMenu: (id: number) => void
}

function toDisplayItems(items: HeaderNavLink[]): HeaderNavLink[] {
  if (items.length > 0) return items
  return FALLBACK_SPARE_PARTS_NAV.map((item, i) => ({
    id: -(i + 1),
    label: item.label,
    href: item.href,
    labelUppercase: item.labelUppercase ?? false,
    openInNewTab: false,
    children: item.children,
  }))
}

export function DesktopNavigation({
  navItems,
  navLoading,
  activeMenu,
  onMenuEnter,
  onMenuLeave,
  onToggleMenu,
}: DesktopNavigationProps) {
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navShellRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<number, HTMLLIElement>())
  const [dropdownLeft, setDropdownLeft] = useState(0)

  const displayItems = toDisplayItems(navItems)
  const activeItem = displayItems.find((item) => item.id === activeMenu)
  const showDropdown =
    !navLoading &&
    activeItem != null &&
    (activeItem.children?.length ?? 0) > 0

  useEffect(() => {
    if (!showDropdown || activeMenu == null) return

    const updatePosition = () => {
      const itemEl = itemRefs.current.get(activeMenu)
      const shellEl = navShellRef.current
      if (!itemEl || !shellEl) return
      const shellRect = shellEl.getBoundingClientRect()
      const itemRect = itemEl.getBoundingClientRect()
      setDropdownLeft(itemRect.left - shellRect.left)
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    return () => window.removeEventListener("resize", updatePosition)
  }, [activeMenu, showDropdown, navItems])

  const handleEnter = useCallback(
    (id: number) => {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current)
      onMenuEnter(id)
    },
    [onMenuEnter]
  )

  const handleLeave = useCallback(() => {
    menuTimerRef.current = setTimeout(onMenuLeave, 120)
  }, [onMenuLeave])

  return (
    <nav
      aria-label="Kategoriler"
      aria-busy={navLoading}
      className="relative z-40 hidden overflow-visible border-t border-brand-border md:block"
    >
      <div
        ref={navShellRef}
        className="relative mx-auto max-w-[1440px] overflow-visible px-4 lg:px-8"
        onMouseLeave={handleLeave}
      >
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex items-center">
            {navLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <li key={`nav-skel-${i}`} className="shrink-0 px-3 py-3.5" aria-hidden>
                  <span
                    className="inline-block h-3 animate-pulse rounded-full bg-brand-border"
                    style={{ width: `${64 + (i % 4) * 12}px` }}
                  />
                </li>
              ))
            ) : (
              displayItems.map((item) => {
                const isAllCategories = item.label.toLowerCase().includes("tüm kategoriler")
                const hasChildren = (item.children?.length ?? 0) > 0
                return (
                  <li
                    key={item.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.id, el)
                      else itemRefs.current.delete(item.id)
                    }}
                    className="relative shrink-0"
                    onMouseEnter={() => (hasChildren ? handleEnter(item.id) : undefined)}
                  >
                    <Link
                      href={item.href}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                      onClick={(e) => {
                        if (!hasChildren) return
                        e.preventDefault()
                        onToggleMenu(item.id)
                      }}
                      className={`group relative flex items-center gap-1 px-3 py-3.5 text-[12px] font-medium tracking-wide transition-colors duration-150 hover:text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/30 ${
                        isAllCategories
                          ? "mr-1 rounded-lg bg-brand-navy px-4 text-white hover:text-white"
                          : "text-brand-muted"
                      } ${activeMenu === item.id && !isAllCategories ? "text-brand-teal" : ""}`}
                    >
                      {isAllCategories && <FaThLarge className="mr-1 h-3 w-3" aria-hidden />}
                      {item.label}
                      {hasChildren ? (
                        <FaChevronDown
                          className={`ml-0.5 h-2.5 w-2.5 transition-transform duration-200 ${
                            activeMenu === item.id ? "rotate-180" : "group-hover:rotate-180"
                          }`}
                        />
                      ) : null}
                      {!isAllCategories && (
                        <span
                          className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-brand-teal transition-transform duration-200 origin-left ${
                            activeMenu === item.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                          }`}
                        />
                      )}
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        <AnimatePresence>
          {showDropdown && activeItem?.children && (
            <motion.div
              key={activeItem.id}
              variants={megaMenuVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ left: dropdownLeft }}
              onMouseEnter={() => handleEnter(activeItem.id)}
              className="absolute top-full z-100 w-max min-w-[240px] pt-0"
            >
              <div className="h-1" />
              <div className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-[0_16px_48px_rgba(8,42,85,0.12)]">
                <div className="h-0.5 bg-brand-teal" />
                <motion.ul variants={listVariants} initial="hidden" animate="show" className="min-w-[240px] p-2">
                  {activeItem.children.map((child, ci) => (
                    <motion.li key={ci} variants={itemVariants}>
                      <Link
                        href={child.href}
                        target={child.openInNewTab ? "_blank" : undefined}
                        rel={child.openInNewTab ? "noopener noreferrer" : undefined}
                        onClick={onMenuLeave}
                        className="group/child flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-brand-muted transition-all hover:bg-brand-page hover:text-brand-teal"
                      >
                        <span>{child.label}</span>
                        <FaChevronRight className="h-2.5 w-2.5 opacity-0 transition-all group-hover/child:translate-x-0.5 group-hover/child:opacity-100" />
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
