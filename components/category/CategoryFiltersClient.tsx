"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { FaFilter, FaTimes } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"

export type FilterAttribute = {
  attributeId: number
  slug: string
  name: string
  type: string
  values: { id: number; value: string; slug: string; colorHex: string | null }[]
}

export type ActiveFilter = { slug: string; value: string }

type Props = {
  children: ReactNode
  filterableAttributes: FilterAttribute[]
  activeFilters: ActiveFilter[]
  totalCount: number
  /** Kategori URL yolu, örn: "taki/altin" */
  fullPath: string
  sort: string
  inStock: boolean
  onSale: boolean
  view: string
  currentPage: number
  currentAttrsStr: string
}

function buildFilterHref(
  fullPath: string,
  current: { sort: string; inStock: boolean; onSale: boolean; view: string; page: number; attrsStr: string },
  overrides: {
    sort?: string
    inStock?: boolean
    onSale?: boolean
    view?: string
    page?: string
    attrs?: string
    toggleAttr?: { slug: string; value: string }
  }
): string {
  const newParams = new URLSearchParams()
  const s = overrides.sort !== undefined ? overrides.sort : current.sort
  const iS = overrides.inStock !== undefined ? overrides.inStock : current.inStock
  const oS = overrides.onSale !== undefined ? overrides.onSale : current.onSale
  const v = overrides.view !== undefined ? overrides.view : current.view
  const p = overrides.page !== undefined ? overrides.page : (current.page > 1 ? current.page.toString() : undefined)

  let attrsStr = overrides.attrs !== undefined ? overrides.attrs : current.attrsStr
  if (overrides.toggleAttr) {
    const t = overrides.toggleAttr
    const key = `${t.slug}:${t.value}`
    const existing = attrsStr ? attrsStr.split(",").filter(Boolean) : []
    attrsStr = existing.includes(key)
      ? existing.filter((k) => k !== key).join(",")
      : [...existing, key].join(",")
  }

  if (s !== "recommended") newParams.set("sort", s)
  if (iS) newParams.set("inStock", "1")
  if (oS) newParams.set("onSale", "1")
  if (v !== "grid4") newParams.set("view", v)
  if (p) newParams.set("page", p)
  if (attrsStr) newParams.set("attrs", attrsStr)

  const qs = newParams.toString()
  return `/categories/${fullPath}${qs ? "?" + qs : ""}`
}

export function CategoryFiltersClient({
  children,
  filterableAttributes,
  activeFilters,
  totalCount,
  fullPath,
  sort,
  inStock,
  onSale,
  view,
  currentPage,
  currentAttrsStr,
}: Props) {
  const createFilterHref = (params: Parameters<typeof buildFilterHref>[2]) =>
    buildFilterHref(fullPath, { sort, inStock, onSale, view, page: currentPage, attrsStr: currentAttrsStr }, params)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [mobileOpen])

  if (filterableAttributes.length === 0) {
    return <>{children}</>
  }

  const filterPanel = (
    <div className="space-y-6">
      {filterableAttributes.map((ca) => (
        <div key={ca.attributeId}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
            {ca.name}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ca.values.map((v) => {
              const isActive = activeFilters.some(
                (f) => f.slug === ca.slug && f.value === v.value
              )
              const href = createFilterHref({
                toggleAttr: { slug: ca.slug, value: v.value },
                page: "1",
              })
              if (ca.type === "COLOR") {
                return (
                  <Link
                    key={v.id}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    title={v.value}
                    className={`relative h-8 w-8 rounded-full border transition-all hover:scale-110 ${
                      isActive ? "ring-2 ring-offset-1 ring-brand-gold" : "border-brand-border"
                    } ${v.colorHex?.toLowerCase() === "#ffffff" ? "border-brand-border" : ""}`}
                    style={{ background: v.colorHex ?? "#ccc" }}
                  />
                )
              }
              return (
                <Link
                  key={v.id}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                      : "border-brand-border text-brand-muted hover:border-brand-gold hover:text-brand-gold"
                  }`}
                >
                  {v.value}
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 border-t border-brand-border pt-4">
        <Link
          href={createFilterHref({ inStock: !inStock, page: "1" })}
          onClick={() => setMobileOpen(false)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            inStock
              ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
              : "border-brand-border text-brand-muted"
          }`}
        >
          Stokta
        </Link>
        <Link
          href={createFilterHref({ onSale: !onSale, page: "1" })}
          onClick={() => setMobileOpen(false)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            onSale
              ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
              : "border-brand-border text-brand-muted"
          }`}
        >
          İndirimde
        </Link>
      </div>

      {activeFilters.length > 0 && (
        <Link
          href={createFilterHref({ attrs: "", page: "1" })}
          onClick={() => setMobileOpen(false)}
          className="text-xs font-medium text-brand-muted underline hover:text-brand-navy"
        >
          Tüm filtreleri temizle
        </Link>
      )}
    </div>
  )

  return (
    <>
      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Link
              key={`${f.slug}:${f.value}`}
              href={createFilterHref({
                toggleAttr: { slug: f.slug, value: f.value },
                page: "1",
              })}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-medium text-brand-gold"
            >
              {f.value}
              <FaTimes className="h-2.5 w-2.5" />
            </Link>
          ))}
          <span className="text-xs text-brand-muted">{totalCount} ürün</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-medium text-brand-navy lg:hidden"
      >
        <FaFilter className="h-3.5 w-3.5 text-brand-gold" />
        Filtrele
        {activeFilters.length > 0 && (
          <span className="rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-semibold text-white">
            {activeFilters.length}
          </span>
        )}
      </button>

      <div className="flex items-start gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <p className="mb-4 text-sm font-semibold text-brand-navy">Filtrele</p>
          {filterPanel}
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-80 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label="Filtreler"
              className="fixed inset-x-0 bottom-0 z-90 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
                <h2 className="font-display text-lg font-semibold text-brand-navy">Filtrele</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Kapat"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-muted hover:bg-brand-page"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4 pb-28">{filterPanel}</div>
              <div className="absolute inset-x-0 bottom-0 border-t border-brand-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-brand-navy text-sm font-semibold text-white"
                >
                  {totalCount} Ürünü Göster
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
