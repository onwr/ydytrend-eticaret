"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { dispatchCartUpdated } from "@/lib/cartEvents"
import { dispatchFavoritesUpdated, FAVORITES_UPDATED_EVENT } from "@/lib/favoriteEvents"
import { registerHrefWithCallbackUrl } from "@/lib/safeCallbackUrl"
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard"

function Toast({ message, ok }: { message: string; ok: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -8, x: "-50%" }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`fixed bottom-8 left-1/2 z-50 flex items-center gap-2.5 rounded-full px-5 py-3 text-[12.5px] font-medium shadow-xl backdrop-blur-sm ${
        ok ? "bg-brand-teal text-white" : "bg-brand-danger text-white"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px]">
        {ok ? "✓" : "✕"}
      </span>
      {message}
    </motion.div>
  )
}

export function HomeProductsSection({
  title,
  subtitle,
  products = [],
  viewAllHref,
}: {
  title: string
  subtitle?: string
  products?: ProductCardData[]
  viewAllHref?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const DRAG_THRESHOLD_PX = 8

  useEffect(() => {
    const loadFavorites = () => {
      fetch("/api/favorites", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((d) => setFavoriteIds(d.productIds ?? []))
        .catch(() => {})
    }
    loadFavorites()
    window.addEventListener(FAVORITES_UPDATED_EVENT, loadFavorites)
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, loadFavorites)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const syncScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 16)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 16)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", syncScrollState, { passive: true })
    syncScrollState()
    return () => el.removeEventListener("scroll", syncScrollState)
  }, [products])

  const scroll = (dir: "prev" | "next") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: el.clientWidth * 0.8 * (dir === "next" ? 1 : -1), behavior: "smooth" })
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest("button")) return
    const el = scrollRef.current
    if (!el) return

    const session = {
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      hasDragged: false,
    }

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - session.startX
      if (!session.hasDragged && Math.abs(delta) > DRAG_THRESHOLD_PX) {
        session.hasDragged = true
      }
      if (session.hasDragged) {
        ev.preventDefault()
        el.scrollLeft = session.startScrollLeft - delta
      }
    }

    const onEnd = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onEnd)
      window.removeEventListener("pointercancel", onEnd)
      if (session.hasDragged) {
        const blockClick = (ce: MouseEvent) => {
          ce.preventDefault()
          ce.stopPropagation()
          document.removeEventListener("click", blockClick, true)
        }
        document.addEventListener("click", blockClick, true)
      }
    }

    window.addEventListener("pointermove", onMove, { passive: false })
    window.addEventListener("pointerup", onEnd)
    window.addEventListener("pointercancel", onEnd)
  }

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault()
    e.stopPropagation()
    setAddingId(productId)
    setToast(null)
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      const json = await res.json()
      if (res.status === 401) {
        router.push(registerHrefWithCallbackUrl(pathname))
        setToast({ msg: "Sepete eklemek için üye olmanız veya giriş yapmanız gerekir.", ok: false })
        return
      }
      if (!res.ok) throw new Error(json.message ?? "Sepete eklenemedi.")
      setToast({ msg: "Ürün sepete eklendi.", ok: true })
      dispatchCartUpdated()
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Sepete eklenemedi.", ok: false })
    } finally {
      setAddingId(null)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (res.ok) {
        setFavoriteIds((prev) =>
          data.isFavorite ? [...prev, productId] : prev.filter((id) => id !== productId)
        )
        dispatchFavoritesUpdated()
        setToast({ msg: data.message, ok: true })
      } else {
        setToast({ msg: data.message ?? "İşlem başarısız.", ok: false })
      }
    } catch {
      setToast({ msg: "Bir hata oluştu.", ok: false })
    }
  }

  if (!products || products.length === 0) return null

  return (
    <section className="py-4 md:py-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-1 md:mb-8"
      >
        <h2 className="text-xl font-bold text-brand-text md:text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-brand-muted">{subtitle}</p>}
      </motion.div>

      <div className="relative">
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              type="button"
              onClick={() => scroll("prev")}
              aria-label="Önceki ürünler"
              className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-border bg-white text-brand-muted shadow-md transition hover:border-brand-teal hover:text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 md:flex"
            >
              <FaChevronLeft className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              type="button"
              onClick={() => scroll("next")}
              aria-label="Sonraki ürünler"
              className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-border bg-white text-brand-muted shadow-md transition hover:border-brand-teal hover:text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 md:flex"
            >
              <FaChevronRight className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>

        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          className="flex touch-pan-x gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              compact
              isFavorite={favoriteIds.includes(product.id)}
              isAdding={addingId === product.id}
              onAddToCart={(e) => void handleAddToCart(e, product.id)}
              onToggleFavorite={(e) => void toggleFavorite(e, product.id)}
            />
          ))}

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex w-[calc((100%-0.75rem)/2)] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-border bg-brand-page transition hover:border-brand-teal hover:bg-brand-blue-light/30 sm:w-44 md:w-[190px]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-white text-brand-muted">
                <FaChevronRight className="h-3.5 w-3.5" />
              </div>
              <span className="px-4 text-center text-[12px] font-medium text-brand-muted">Tümünü Gör</span>
            </Link>
          )}
        </div>
      </div>

      {viewAllHref && (
        <div className="mt-6 flex justify-center md:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-5 py-2.5 text-[13px] font-semibold text-brand-navy transition hover:border-brand-teal hover:text-brand-teal"
          >
            Tüm Ürünleri Gör
            <FaChevronRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      )}

      <AnimatePresence>{toast && <Toast message={toast.msg} ok={toast.ok} />}</AnimatePresence>
    </section>
  )
}

/** @deprecated alias */
export const ProductSection = HomeProductsSection
