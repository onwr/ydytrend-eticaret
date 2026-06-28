"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  FaChevronDown,
  FaHeart,
  FaMinus,
  FaPhoneAlt,
  FaPlus,
  FaRegStar,
  FaStar,
} from "react-icons/fa"
import { dispatchCartUpdated } from "@/lib/cartEvents"
import { dispatchFavoritesUpdated, FAVORITES_UPDATED_EVENT } from "@/lib/favoriteEvents"
import type { ProductDetailViewModel } from "@/lib/productDetailShape"
import { registerHrefWithCallbackUrl } from "@/lib/safeCallbackUrl"
import { ProductImageZoom } from "./ProductImageZoom"
import { HomeProductsSection } from "../home/HomeProductsSection"
import {
  galleryImagesWithVariant,
  preferredGalleryIndex,
} from "@/lib/variantGalleryImage"

type PhoneOrderSettings = {
  whatsappNumber: string
  callNumber: string
}

import { trackAnalyticsEventSafe, cartLinesToAnalyticsItems } from "@/lib/analytics/trackSafe"

type Props = {
  product: ProductDetailViewModel
}

export function ProductDetailClient({ product }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    product.variants[0]?.id ?? 0
  )
  const [quantity, setQuantity] = useState(1)
  const [openAccordion, setOpenAccordion] = useState<"" | "features" | "comments" | "payment">(
    product.accordions[0]?.id ?? "features"
  )
  const [cartFeedback, setCartFeedback] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [phonePopupOpen, setPhonePopupOpen] = useState(false)
  const [phoneSettings, setPhoneSettings] = useState<PhoneOrderSettings>({
    whatsappNumber: "",
    callNumber: "",
  })
  const [phoneSettingsLoading, setPhoneSettingsLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    trackAnalyticsEventSafe("view_item", {
      currency: "TRY",
      value: product.displayPrice,
      items: [
        {
          item_id: String(product.productId),
          item_name: product.title,
          price: product.displayPrice,
          item_category: product.categoryLabel,
        },
      ],
    })
  }, [product.productId, product.title, product.displayPrice, product.categoryLabel])

  const selectedVariant = useMemo(
    () => product.variants.find((item) => item.id === selectedVariantId) ?? product.variants[0],
    [product.variants, selectedVariantId]
  )

  // Her attribute için mevcut seçilen değer (slug → value string)
  const [selectedAttrValues, setSelectedAttrValues] = useState<Record<string, string>>(() => {
    const first = product.variants[0]
    if (!first) return {}
    return Object.fromEntries(first.richAttributes.map((a) => [a.slug, a.value]))
  })

  // Seçilen attribute kombinasyonuna göre varyant bul
  const findVariantByAttrs = (attrs: Record<string, string>) => {
    return product.variants.find((v) =>
      v.richAttributes.every((a) => attrs[a.slug] === a.value)
    )
  }

  const handleAttrChange = (slug: string, value: string) => {
    const next = { ...selectedAttrValues, [slug]: value }
    setSelectedAttrValues(next)
    const found = findVariantByAttrs(next)
    if (found) {
      setSelectedVariantId(found.id)
      const variantImage = found.imageUrl ?? null
      const gallery = galleryImagesWithVariant(
        product.images.map((i) => ({ src: i.src, alt: i.alt })),
        variantImage
      )
      const idx = preferredGalleryIndex(
        gallery,
        variantImage,
        selectedImageIndex
      )
      setSelectedImageIndex(idx)
    }
  }

  // Tüm attribute eksenlerini çıkar (yalnızca richAttributes olan varyantlarda)
  const attrAxes = useMemo(() => {
    const axes: Map<string, { slug: string; name: string; type: string; values: Map<string, { value: string; colorHex?: string | null }> }> = new Map()
    for (const v of product.variants) {
      for (const a of v.richAttributes) {
        if (!axes.has(a.slug)) {
          axes.set(a.slug, { slug: a.slug, name: a.key, type: a.type, values: new Map() })
        }
        axes.get(a.slug)!.values.set(a.value, { value: a.value, colorHex: a.colorHex ?? null })
      }
    }
    return Array.from(axes.values()).map((ax) => ({ ...ax, values: Array.from(ax.values.values()) }))
  }, [product.variants])

  const hasRichAttrs = attrAxes.length > 0

  // Bir değerin seçilebilir olup olmadığını kontrol et (0 stok veya pasif değilse)
  const isValueAvailable = (slug: string, value: string) => {
    const attrs = { ...selectedAttrValues, [slug]: value }
    const match = findVariantByAttrs(attrs)
    return !match || (match.stock > 0 && match.isActive)
  }

  const ratingStars = Array.from({ length: 5 }, (_, i) => i < product.rating)

  useEffect(() => {
    const loadFavorite = () => {
      fetch("/api/favorites", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((d: { productIds?: number[] }) => {
          setIsFavorite((d.productIds ?? []).includes(product.productId))
        })
        .catch(() => {})
    }
    loadFavorite()
    window.addEventListener(FAVORITES_UPDATED_EVENT, loadFavorite)
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, loadFavorite)
  }, [product.productId])

  useEffect(() => {
    if (!phonePopupOpen) return
    if (phoneSettings.whatsappNumber || phoneSettings.callNumber) return
    let cancelled = false
    fetch("/api/phone-order")
      .then((r) => r.json())
      .then((d: Partial<PhoneOrderSettings>) => {
        if (cancelled) return
        setPhoneSettings({
          whatsappNumber: typeof d.whatsappNumber === "string" ? d.whatsappNumber : "",
          callNumber: typeof d.callNumber === "string" ? d.callNumber : "",
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPhoneSettingsLoading(false)
      })
    void Promise.resolve().then(() => {
      if (!cancelled) setPhoneSettingsLoading(true)
    })
    return () => {
      cancelled = true
    }
  }, [phonePopupOpen, phoneSettings.whatsappNumber, phoneSettings.callNumber])

  const whatsappHref = useMemo(() => {
    if (!phoneSettings.whatsappNumber) return ""
    const message = encodeURIComponent(
      `Merhaba, bu ürünü sipariş vermek istiyorum:\n${product.title}\n${window.location.href}`
    )
    return `https://wa.me/${phoneSettings.whatsappNumber}?text=${message}`
  }, [phoneSettings.whatsappNumber, product.title])

  const callHref = useMemo(() => {
    const raw = phoneSettings.callNumber.trim()
    if (!raw) return ""
    const href = raw.startsWith("+") ? `tel:${raw}` : `tel:+${raw}`
    return href
  }, [phoneSettings.callNumber])

  const handleAddToCart = async (redirectToCheckout = false) => {
    if (!selectedVariant) {
      setCartFeedback("Sepete eklemek için bir varyant seçmelisiniz.")
      return false
    }

    setIsAdding(true)
    setCartFeedback(null)
    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          productId: product.productId,
          variantId: selectedVariant.id,
          quantity,
        }),
      })
      const json = (await response.json()) as { message?: string }
      if (response.status === 401) {
        router.push(registerHrefWithCallbackUrl(pathname))
        setCartFeedback("Sepete eklemek için üye olmanız veya giriş yapmanız gerekir.")
        return false
      }
      if (!response.ok) {
        throw new Error(json.message ?? "Ürün sepete eklenemedi.")
      }
      setCartFeedback("Ürün sepete eklendi.")
      dispatchCartUpdated()
      trackAnalyticsEventSafe("add_to_cart", {
        currency: "TRY",
        value: product.displayPrice * quantity,
        items: [
          {
            item_id: String(product.productId),
            item_name: product.title,
            price: product.displayPrice,
            quantity,
            item_category: product.categoryLabel,
          },
        ],
      })
      if (redirectToCheckout) {
        router.push("/checkout")
      }
      return true
    } catch (error) {
      setCartFeedback(
        error instanceof Error ? error.message : "Ürün sepete eklenemedi."
      )
      return false
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true)
    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ productId: product.productId }),
      })
      const data = (await res.json()) as { isFavorite?: boolean; message?: string }
      if (res.status === 401) {
        router.push(registerHrefWithCallbackUrl(pathname))
        return
      }
      if (!res.ok) {
        setCartFeedback(data.message ?? "Favori işlemi başarısız.")
        return
      }
      setIsFavorite(Boolean(data.isFavorite))
      dispatchFavoritesUpdated()
      if (data.isFavorite) {
        trackAnalyticsEventSafe("add_to_wishlist", {
          currency: "TRY",
          value: product.displayPrice,
          items: [
            {
              item_id: String(product.productId),
              item_name: product.title,
              price: product.displayPrice,
              item_category: product.categoryLabel,
            },
          ],
        })
      }
    } catch {
      setCartFeedback("Bağlantı hatası.")
    } finally {
      setFavoriteLoading(false)
    }
  }

  const salePriceText = selectedVariant?.priceText ?? product.priceText
  const canPurchase =
    selectedVariant && selectedVariant.stock > 0 && selectedVariant.isActive

  return (
    <>
    <div className="grid grid-cols-1 gap-8 pb-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-0">
      <section>
        <div className="flex gap-3">
          <div className="hidden w-16 shrink-0 space-y-2 sm:block">
            {product.images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`overflow-hidden rounded-lg border transition ${index === selectedImageIndex
                    ? "border-brand-gold"
                    : "border-zinc-200 hover:border-zinc-300"
                  }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={64}
                  height={80}
                  className="h-20 w-16 object-cover"
                />
              </button>
            ))}
          </div>

          <div className="w-full">
            <ProductImageZoom
              images={product.images}
              currentIndex={selectedImageIndex}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
          {product.images.map((image, index) => (
            <button
              key={`${image.src}-mobile`}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={`overflow-hidden rounded-md border transition ${index === selectedImageIndex
                  ? "border-brand-gold"
                  : "border-zinc-200"
                }`}
            >
              <Image src={image.src} alt={image.alt} width={64} height={80} className="h-16 w-14 object-cover" />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h1 className="text-2xl font-semibold leading-tight text-zinc-900 md:text-3xl">{product.title}</h1>

        {product.extraCategories?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {product.extraCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-[12px] font-medium text-zinc-700 transition hover:bg-zinc-200"
              >
                {c.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-1 text-brand-gold">
          {ratingStars.map((active, idx) =>
            active ? <FaStar key={idx} className="h-4 w-4" /> : <FaRegStar key={idx} className="h-4 w-4" />
          )}
          <span className="ml-2 text-sm text-zinc-500">({product.reviewCount})</span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-5">
          <div className="flex flex-col gap-1">
            {(() => {
              const listPrice =
                selectedVariant?.compareAtPriceText ?? product.compareAtPriceText
              const discountPct =
                selectedVariant?.discountPct ?? product.discountPct
              const salePrice = selectedVariant?.priceText ?? product.priceText
              return (
                <>
                  {listPrice && discountPct ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400 line-through">{listPrice}</span>
                      <span className="rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        %{discountPct} İndirim
                      </span>
                    </div>
                  ) : null}
                  <strong className="text-3xl font-semibold text-zinc-900">{salePrice}</strong>
                </>
              )
            })()}
          </div>
          <div className="text-sm text-zinc-500">
            <p className="font-medium text-zinc-700">Kredi Kartı</p>
            <p>{product.installmentsLabel}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {hasRichAttrs ? (
            // Rich attribute seçim UI: renk swatch + chip
            attrAxes.map((axis) => (
              <div key={axis.slug}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-800">{axis.name}</span>
                  {selectedAttrValues[axis.slug] && (
                    <span className="text-sm text-zinc-500">{selectedAttrValues[axis.slug]}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {axis.values.map((v) => {
                    const isSelected = selectedAttrValues[axis.slug] === v.value
                    const available = isValueAvailable(axis.slug, v.value)
                    if (axis.type === "COLOR") {
                      const isWhite = v.colorHex && v.colorHex.toLowerCase() === "#ffffff"
                      return (
                        <button
                          key={v.value}
                          type="button"
                          disabled={!available}
                          title={v.value}
                          onClick={() => available && handleAttrChange(axis.slug, v.value)}
                          className={`relative h-8 w-8 rounded-full transition-all ${
                            isSelected ? "ring-2 ring-offset-2 ring-brand-gold" : ""
                          } ${!available ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-110"} ${
                            isWhite ? "border border-zinc-300" : ""
                          }`}
                          style={{ background: v.colorHex ?? "#ccc" }}
                        >
                          {!available && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="block h-px w-full rotate-45 bg-zinc-400/70" />
                            </span>
                          )}
                        </button>
                      )
                    }
                    return (
                      <button
                        key={v.value}
                        type="button"
                        disabled={!available}
                        onClick={() => available && handleAttrChange(axis.slug, v.value)}
                        className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                          isSelected
                            ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                            : available
                            ? "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                            : "border-zinc-100 text-zinc-300 line-through cursor-not-allowed"
                        }`}
                      >
                        {v.value}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            // Fallback: plain select (eski JSON varyantlar veya isimsiz)
            <>
              <label htmlFor="variant" className="mb-2 block text-sm font-semibold text-zinc-800">
                Seçenek
              </label>
              <select
                id="variant"
                value={selectedVariant?.id ?? 0}
                onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-brand-gold"
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id} disabled={variant.stock <= 0 || !variant.isActive}>
                    {variant.label}{!variant.isActive ? " (Pasif)" : variant.stock <= 0 ? " (Tükendi)" : ""}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-600">
              SKU: {selectedVariant?.sku ?? "-"}
            </span>
            <span className={`rounded-full px-2.5 py-1 ${
              selectedVariant && selectedVariant.stock <= 0
                ? "bg-red-50 text-red-600"
                : "bg-brand-page text-brand-muted"
            }`}>
              {selectedVariant?.stockText ?? "Stok bilgisi yok"}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto]">
          <div className="flex h-11 items-center rounded-lg border border-zinc-300">
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="flex h-full w-10 items-center justify-center text-zinc-600 transition hover:bg-zinc-100"
            >
              <FaMinus className="h-3 w-3" />
            </button>
            <span className="w-9 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((prev) => prev + 1)}
              className="flex h-full w-10 items-center justify-center text-zinc-600 transition hover:bg-zinc-100"
            >
              <FaPlus className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            disabled={isAdding || !canPurchase}
            onClick={() => void handleAddToCart()}
            className={`h-11 rounded-lg px-6 text-sm font-semibold tracking-wide text-white transition ${
              !canPurchase
                ? "bg-zinc-300 cursor-not-allowed"
                : "bg-brand-gold hover:bg-brand-gold/90"
            }`}
          >
            {isAdding
              ? "Ekleniyor..."
              : !canPurchase
              ? "Tükendi"
              : "Sepete Ekle"}
          </button>

          <button
            type="button"
            disabled={isAdding || !canPurchase}
            onClick={() => void handleAddToCart(true)}
            className={`hidden h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition sm:flex ${
              !canPurchase
                ? "cursor-not-allowed border-zinc-200 text-zinc-400"
                : "border-brand-navy text-brand-navy hover:bg-brand-page"
            }`}
          >
            Hemen Al
          </button>

          <button
            type="button"
            disabled={favoriteLoading}
            onClick={() => void handleToggleFavorite()}
            aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            aria-pressed={isFavorite}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-4 transition ${
              isFavorite
                ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                : "border-zinc-300 text-zinc-600 hover:border-brand-gold hover:text-brand-gold"
            }`}
          >
            <FaHeart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPhonePopupOpen(true)}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-page px-5 text-sm font-semibold text-brand-muted transition hover:bg-brand-page"
        >
          <FaPhoneAlt className="h-3.5 w-3.5" />
          {product.phoneOrderLabel || "Telefonla / WhatsApp'tan Sipariş Ver"}
        </button>

        {phonePopupOpen ? (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <button
              type="button"
              onClick={() => setPhonePopupOpen(false)}
              className="absolute inset-0 bg-black/50"
              aria-label="Kapat"
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-black text-zinc-900">Telefonla Sipariş</p>
                  <p className="mt-1 text-[12px] text-zinc-500">
                    WhatsApp’tan yazabilir veya doğrudan arayabilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPhonePopupOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:text-zinc-700"
                >
                  Kapat
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <a
                  href={whatsappHref || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!whatsappHref || phoneSettingsLoading}
                  className={`flex h-11 items-center justify-center rounded-xl border px-4 text-[13px] font-bold transition
                    ${whatsappHref && !phoneSettingsLoading
                      ? "border-brand-border bg-brand-page text-brand-muted hover:bg-brand-page"
                      : "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"}`}
                  onClick={(e) => {
                    if (!whatsappHref || phoneSettingsLoading) e.preventDefault()
                  }}
                >
                  {phoneSettingsLoading ? "Yükleniyor…" : "WhatsApp’tan Yaz"}
                </a>

                <a
                  href={callHref || "#"}
                  aria-disabled={!callHref || phoneSettingsLoading}
                  className={`flex h-11 items-center justify-center rounded-xl border px-4 text-[13px] font-bold transition
                    ${callHref && !phoneSettingsLoading
                      ? "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                      : "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"}`}
                  onClick={(e) => {
                    if (!callHref || phoneSettingsLoading) e.preventDefault()
                  }}
                >
                  Ara
                </a>
              </div>
            </div>
          </div>
        ) : null}

        {cartFeedback ? (
          <p className={`mt-2 text-sm ${cartFeedback.includes("eklendi") ? "text-emerald-700" : "text-rose-600"}`}>
            {cartFeedback}
          </p>
        ) : null}

        <div className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
          {product.accordions.map((item) => {
            const isOpen = openAccordion === item.id
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenAccordion((prev) => (prev === item.id ? "" : item.id))}
                  className="flex w-full items-center justify-between py-4 text-left"
                >
                  <span className="text-sm font-semibold uppercase tracking-wide text-zinc-800">{item.title}</span>
                  <FaChevronDown
                    className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600">{item.content}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-12 lg:col-span-2">
        <div className="mb-8 border-t border-zinc-100 pt-12">
          <HomeProductsSection title="İlginizi Çekebilir" />
        </div>
      </section>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-white/95 p-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-brand-muted">{product.title}</p>
          <p className="text-lg font-semibold text-brand-navy">{salePriceText}</p>
        </div>
        <button
          type="button"
          disabled={isAdding || !canPurchase}
          onClick={() => void handleAddToCart()}
          className={`h-11 shrink-0 rounded-xl px-5 text-sm font-semibold text-white ${
            !canPurchase ? "bg-zinc-300" : "bg-brand-gold"
          }`}
        >
          {isAdding ? "..." : !canPurchase ? "Tükendi" : "Sepete Ekle"}
        </button>
      </div>
    </div>
    </>
  )
}
