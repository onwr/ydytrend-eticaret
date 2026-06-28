"use client"

import Image from "next/image"
import Link from "next/link"
import { FaSearch, FaTimes, FaChevronRight, FaTag } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef, startTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { trackAnalyticsEventSafe } from "@/lib/analytics/trackSafe"

interface SearchProduct {
  id: number
  name: string
  slug: string
  basePrice: number
  compareAtPrice?: number | null
  images: { url: string; isCover?: boolean }[]
  variants: { price: number; compareAtPrice?: number | null }[]
  category?: { name: string; slug: string } | null
  pricing?: { current: string; old: string | null; hasDiscount: boolean }
}

interface SearchCategory {
  id: number
  name: string
  slug: string
  imageUrl?: string | null
}

interface SearchBarProps {
  className?: string
  inputClassName?: string
  onNavigate?: () => void
}

export function SearchBar({ className = "", inputClassName = "", onNavigate }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<SearchProduct[]>([])
  const [categories, setCategories] = useState<SearchCategory[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalItems = categories.length + products.length

  useEffect(() => {
    if (query.length < 2) {
      startTransition(() => {
        setProducts([])
        setCategories([])
        setActiveIndex(-1)
      })
      return
    }
    startTransition(() => setIsSearchLoading(true))
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setProducts(data.products || [])
        setCategories(data.categories || [])
        setActiveIndex(-1)
      } catch {
        /* ignore */
      } finally {
        setIsSearchLoading(false)
      }
    }, 280)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const close = useCallback(() => {
    setShowSearch(false)
    onNavigate?.()
  }, [onNavigate])

  const trackSearch = useCallback((term: string) => {
    const q = term.trim()
    if (q.length >= 2) {
      trackAnalyticsEventSafe("search", { search_term: q, currency: "TRY" })
    }
  }, [])

  const navigateToActive = useCallback(() => {
    if (activeIndex < 0) {
      trackSearch(query)
      router.push(`/search?q=${encodeURIComponent(query)}`)
      close()
      return
    }
    if (activeIndex < categories.length) {
      const cat = categories[activeIndex]
      if (cat) {
        router.push(`/categories/${cat.slug}`)
        close()
      }
      return
    }
    const product = products[activeIndex - categories.length]
    if (product) {
      router.push(`/products/${product.slug}`)
      close()
    }
  }, [activeIndex, categories, products, query, router, close, trackSearch])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearch || query.length < 2) {
      if (e.key === "Enter" && query.trim()) {
        trackSearch(query)
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        close()
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(totalItems, 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? totalItems - 1 : i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      navigateToActive()
    } else if (e.key === "Escape") {
      setShowSearch(false)
    }
  }

  return (
    <div className={`relative z-60 min-w-0 ${className}`} ref={searchRef}>
      <form
        action="/search"
        method="GET"
        onSubmit={(e) => {
          if (activeIndex >= 0) {
            e.preventDefault()
            navigateToActive()
          }
        }}
      >
        <div className="relative flex items-center">
          <FaSearch className="pointer-events-none absolute left-4 z-10 h-3.5 w-3.5 text-brand-gold" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            name="q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSearch(true)
            }}
            onFocus={() => setShowSearch(true)}
            onKeyDown={handleKeyDown}
            placeholder="Ürün, kategori veya aksesuar ara..."
            autoComplete="off"
            role="combobox"
            aria-expanded={showSearch && query.length >= 2}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            className={`h-11 w-full rounded-xl border border-brand-border bg-brand-blush-soft/50 pl-10 pr-10 text-[13px] text-brand-text placeholder:text-brand-muted outline-none transition-all duration-200 focus:border-brand-gold focus:bg-white focus:ring-2 focus:ring-brand-gold/15 ${inputClassName}`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setProducts([])
                setCategories([])
                inputRef.current?.focus()
              }}
              className="absolute right-4 rounded text-brand-muted transition-colors hover:text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
              aria-label="Aramayı temizle"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {showSearch && query.length >= 2 && (
          <motion.div
            id="search-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-70 max-h-[min(70vh,420px)] overflow-y-auto rounded-2xl border border-brand-border bg-white shadow-[0_16px_48px_rgba(35,32,32,0.12)]"
          >
            {isSearchLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-brand-border border-t-brand-gold" />
              </div>
            ) : totalItems > 0 ? (
              <div>
                {categories.length > 0 && (
                  <div className="border-b border-brand-border">
                    <p className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                      Kategoriler
                    </p>
                    <ul>
                      {categories.map((cat, i) => (
                        <li key={cat.id} role="option" aria-selected={activeIndex === i}>
                          <Link
                            href={`/categories/${cat.slug}`}
                            onClick={close}
                            className={`group flex items-center gap-3 px-4 py-2.5 transition-colors ${
                              activeIndex === i ? "bg-brand-blush-soft" : "hover:bg-brand-page"
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blush-soft text-brand-gold">
                              <FaTag className="h-3.5 w-3.5" />
                            </span>
                            <span className="flex-1 text-[13px] font-medium text-brand-text group-hover:text-brand-gold">
                              {cat.name}
                            </span>
                            <FaChevronRight className="h-3 w-3 text-brand-border group-hover:text-brand-gold" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {products.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                      Ürünler
                    </p>
                    <ul>
                      {products.map((product, pi) => {
                        const idx = categories.length + pi
                        const price =
                          product.pricing?.current ??
                          Number(product.variants[0]?.price ?? product.basePrice).toFixed(2)
                        const oldPrice = product.pricing?.old
                        return (
                          <li key={product.id} role="option" aria-selected={activeIndex === idx}>
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={close}
                              className={`group flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                activeIndex === idx ? "bg-brand-blush-soft" : "hover:bg-brand-page"
                              }`}
                            >
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-brand-border bg-brand-blush-soft/40">
                                <Image
                                  src={product.images[0]?.url || "/logo.png"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-medium text-brand-text group-hover:text-brand-gold">
                                  {product.name}
                                </p>
                                {product.category && (
                                  <p className="truncate text-[11px] text-brand-muted">{product.category.name}</p>
                                )}
                                <div className="mt-0.5 flex items-center gap-2">
                                  <p className="text-sm font-semibold text-brand-navy">₺{price}</p>
                                  {oldPrice && (
                                    <p className="text-[11px] text-brand-muted line-through">₺{oldPrice}</p>
                                  )}
                                </div>
                              </div>
                              <FaChevronRight className="h-3 w-3 shrink-0 text-brand-border group-hover:text-brand-gold" />
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                <div className="sticky bottom-0 border-t border-brand-border bg-white px-4 py-2.5">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={close}
                    className="flex items-center justify-between text-[12px] font-semibold text-brand-gold hover:text-brand-navy"
                  >
                    <span>&quot;{query}&quot; için tüm sonuçlar</span>
                    <FaChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-brand-muted">
                  &quot;{query}&quot; için sonuç bulunamadı
                </p>
                <p className="mt-1 text-xs text-brand-muted/70">Farklı bir arama yapmayı deneyin</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
