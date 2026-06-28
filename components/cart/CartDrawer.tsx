"use client"

import { motion, AnimatePresence } from "framer-motion"
import { FaTimes, FaTrash, FaMinus, FaPlus, FaShoppingBag, FaLock } from "react-icons/fa"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, useCallback, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { CART_UPDATED_EVENT } from "@/lib/cartEvents"
import { trackAnalyticsEventSafe, cartLinesToAnalyticsItems } from "@/lib/analytics/trackSafe"
import { StorefrontEmptyState } from "@/components/ui/StorefrontEmptyState"

interface CartLine {
  itemId: number
  productId: number
  productSlug: string
  productName: string
  imageUrl: string
  variantId: number | null
  variantName: string
  unitPrice: number
  quantity: number
  lineTotal: number
  stock: number | null
}

interface CartSummary {
  itemCount: number
  subtotal: number
  shipping: number
  grandTotal: number
  freeShippingThreshold?: number
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [summary, setSummary] = useState<CartSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cart")
      const data = await res.json()
      if (res.ok) {
        setLines(data.lines || [])
        setSummary(data.summary || null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) setLoading(true)
    })
    void (async () => {
      try {
        const res = await fetch("/api/cart")
        const data = await res.json()
        if (cancelled) return
        if (res.ok) {
          setLines(data.lines || [])
          setSummary(data.summary || null)
          if ((data.lines?.length ?? 0) > 0) {
            trackAnalyticsEventSafe("view_cart", {
              currency: "TRY",
              value: data.summary?.grandTotal,
              items: cartLinesToAnalyticsItems(
                data.lines.map((l: CartLine) => ({
                  productId: l.productId,
                  name: l.productName,
                  unitPrice: l.unitPrice,
                  quantity: l.quantity,
                }))
              ),
            })
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen])

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

  useEffect(() => {
    const handleUpdate = () => void fetchCart()
    window.addEventListener(CART_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleUpdate)
  }, [fetchCart])

  const updateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      })
      if (res.ok) void fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  const removeItem = async (itemId: number) => {
    const line = lines.find((l) => l.itemId === itemId)
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" })
      if (res.ok) {
        if (line) {
          trackAnalyticsEventSafe("remove_from_cart", {
            currency: "TRY",
            value: line.lineTotal,
            items: cartLinesToAnalyticsItems([
              {
                productId: line.productId,
                name: line.productName,
                unitPrice: line.unitPrice,
                quantity: line.quantity,
              },
            ]),
          })
        }
        void fetchCart()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const threshold = summary?.freeShippingThreshold ?? 750
  const remainingFreeShip =
    summary && summary.subtotal < threshold ? threshold - summary.subtotal : 0

  if (!mounted) return null

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex justify-end overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label="Sepet"
            className="relative z-10000 flex h-full w-full max-w-md flex-col bg-white shadow-[-12px_0_40px_rgba(35,32,32,0.15)]"
          >
            <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blush-soft text-brand-gold">
                  <FaShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-brand-navy">Sepetim</h2>
                  <p className="text-xs text-brand-muted">{summary?.itemCount ?? 0} ürün</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Sepeti kapat"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-muted hover:bg-brand-page"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading && lines.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-brand-border border-t-brand-gold" />
                </div>
              ) : lines.length > 0 ? (
                <div className="space-y-5">
                  {lines.map((line) => (
                    <div key={line.itemId} className="flex gap-3 border-b border-brand-border pb-5 last:border-0">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-brand-border bg-brand-blush-soft/30">
                        <Image src={line.imageUrl} alt={line.productName} fill className="object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <Link
                            href={`/products/${line.productSlug}`}
                            onClick={onClose}
                            className="line-clamp-2 text-sm font-medium text-brand-text hover:text-brand-gold"
                          >
                            {line.productName}
                          </Link>
                          <button
                            type="button"
                            onClick={() => void removeItem(line.itemId)}
                            aria-label="Ürünü kaldır"
                            className="shrink-0 text-brand-muted hover:text-brand-danger"
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {line.variantName && line.variantName !== "Standart" && (
                          <p className="mt-0.5 text-[11px] text-brand-muted">{line.variantName}</p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex h-9 items-center rounded-lg border border-brand-border">
                            <button
                              type="button"
                              onClick={() => void updateQuantity(line.itemId, line.quantity - 1)}
                              className="px-2.5 text-brand-muted hover:text-brand-navy"
                              aria-label="Azalt"
                            >
                              <FaMinus className="h-2.5 w-2.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-medium">{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => void updateQuantity(line.itemId, line.quantity + 1)}
                              className="px-2.5 text-brand-muted hover:text-brand-navy"
                              aria-label="Artır"
                            >
                              <FaPlus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-brand-navy">
                            ₺{line.lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <StorefrontEmptyState
                  icon={<FaShoppingBag className="h-7 w-7" />}
                  title="Sepetiniz henüz boş"
                  description="Tarzını tamamlayan parçaları keşfedin ve sepetinize ekleyin."
                  actionLabel="Alışverişe Başla"
                  onAction={onClose}
                />
              )}
            </div>

            {lines.length > 0 && summary && (
              <div className="border-t border-brand-border bg-brand-page/80 px-5 py-4 backdrop-blur-sm">
                {remainingFreeShip > 0 && (
                  <p className="mb-3 rounded-xl bg-brand-blush-soft px-3 py-2 text-center text-[11px] text-brand-muted">
                    Ücretsiz kargoya{" "}
                    <span className="font-semibold text-brand-gold">₺{remainingFreeShip.toFixed(2)}</span> kaldı
                  </p>
                )}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Ara toplam</span>
                  <span className="text-lg font-bold text-brand-navy">₺{summary.subtotal.toFixed(2)}</span>
                </div>
                <div className="grid gap-2">
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="flex h-12 items-center justify-center rounded-xl bg-brand-navy text-sm font-semibold text-white transition hover:bg-brand-gold"
                  >
                    Ödemeye Geç
                  </Link>
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="flex h-11 items-center justify-center rounded-xl border border-brand-border bg-white text-sm font-medium text-brand-muted hover:text-brand-navy"
                  >
                    Sepete Git
                  </Link>
                </div>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-brand-muted">
                  <FaLock className="h-3 w-3" />
                  Güvenli ödeme
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
