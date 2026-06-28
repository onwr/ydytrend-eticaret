"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { dispatchCartUpdated } from "@/lib/cartEvents"
import { dispatchFavoritesUpdated, FAVORITES_UPDATED_EVENT } from "@/lib/favoriteEvents"
import { registerHrefWithCallbackUrl } from "@/lib/safeCallbackUrl"
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard"
import { StorefrontEmptyState } from "@/components/ui/StorefrontEmptyState"
import { trackAnalyticsEventSafe } from "@/lib/analytics/trackSafe"
import { FaShoppingBag } from "react-icons/fa"

interface Product {
  id: string
  slug: string
  name: string
  basePrice: number
  compareAtPrice?: number | null
  images: { url: string; isCover?: boolean }[]
  variants: { price: number; stock: number }[]
  category?: { name: string } | null
  isFeatured?: boolean
}

interface CategoryListingClientProps {
  products: Product[]
  view: "grid2" | "grid4"
}

export function CategoryListingClient({ products, view }: CategoryListingClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)

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
    if (products.length === 0) return
    trackAnalyticsEventSafe("view_item_list", {
      currency: "TRY",
      items: products.map((p) => ({
        item_id: String(p.id),
        item_name: p.name,
        price: p.variants[0]?.price ?? p.basePrice,
        item_category: p.category?.name,
      })),
    })
  }, [products])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(t)
  }, [toast])

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
      if (!res.ok) {
        setToast({ msg: data.message || "Favori işlemi başarısız.", ok: false })
        return
      }
      setFavoriteIds((prev) =>
        data.isFavorite ? [...prev, productId] : prev.filter((id) => id !== productId)
      )
      dispatchFavoritesUpdated()
      if (data.isFavorite) {
        const product = products.find((p) => Number(p.id) === productId)
        if (product) {
          trackAnalyticsEventSafe("add_to_wishlist", {
            currency: "TRY",
            value: product.variants[0]?.price ?? product.basePrice,
            items: [
              {
                item_id: String(product.id),
                item_name: product.name,
                price: product.variants[0]?.price ?? product.basePrice,
                item_category: product.category?.name,
              },
            ],
          })
        }
      }
      setToast({ msg: data.message || "Favoriler güncellendi.", ok: true })
    } catch {
      setToast({ msg: "Bağlantı hatası.", ok: false })
    }
  }

  const addToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault()
    e.stopPropagation()
    setAddingId(productId)
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      const data = await res.json()
      if (res.status === 401) {
        router.push(registerHrefWithCallbackUrl("/login", pathname))
        return
      }
      if (!res.ok) {
        setToast({ msg: data.message || "Sepete eklenemedi.", ok: false })
        return
      }
      dispatchCartUpdated()
      const product = products.find((p) => Number(p.id) === productId)
      if (product) {
        trackAnalyticsEventSafe("add_to_cart", {
          currency: "TRY",
          value: product.variants[0]?.price ?? product.basePrice,
          items: [
            {
              item_id: String(product.id),
              item_name: product.name,
              price: product.variants[0]?.price ?? product.basePrice,
              quantity: 1,
              item_category: product.category?.name,
            },
          ],
        })
      }
      setToast({ msg: "Ürün sepete eklendi.", ok: true })
    } catch {
      setToast({ msg: "Bağlantı hatası.", ok: false })
    } finally {
      setAddingId(null)
    }
  }

  if (products.length === 0) {
    return (
      <StorefrontEmptyState
        icon={<FaShoppingBag className="h-7 w-7" />}
        title="Bu kategoride ürün bulunamadı"
        description="Filtreleri temizleyerek veya farklı bir kategori deneyerek keşfe devam edebilirsiniz."
        actionLabel="Tüm Ürünleri Keşfet"
        actionHref="/categories"
      />
    )
  }

  const cardProducts: ProductCardData[] = products.map((p) => ({
    id: Number(p.id),
    name: p.name,
    slug: p.slug,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    images: p.images.map((img, i) => ({ url: img.url, isCover: img.isCover ?? i === 0 })),
    category: p.category ?? undefined,
    variants: p.variants,
    isBestseller: p.isFeatured,
  }))

  return (
    <>
      <div
        className={`grid gap-x-4 gap-y-8 sm:gap-y-10 ${
          view === "grid2" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {cardProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorite={favoriteIds.includes(product.id)}
            isAdding={addingId === product.id}
            onToggleFavorite={(e) => void toggleFavorite(e, product.id)}
            onAddToCart={(e) => void addToCart(e, product.id)}
            onSelect={() => {
              trackAnalyticsEventSafe("select_item", {
                currency: "TRY",
                items: [
                  {
                    item_id: String(product.id),
                    item_name: product.name,
                    price: product.variants?.[0]?.price ?? Number(product.basePrice),
                    item_category: product.category?.name,
                  },
                ],
              })
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -8, x: "-50%" }}
            className={`fixed bottom-8 left-1/2 z-50 rounded-full px-5 py-3 text-sm font-medium shadow-xl ${
              toast.ok ? "bg-brand-gold text-white" : "bg-brand-danger text-white"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
