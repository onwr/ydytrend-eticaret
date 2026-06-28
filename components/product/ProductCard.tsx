"use client"

import Image from "next/image"
import Link from "next/link"
import { FaRegHeart, FaHeart, FaShoppingBag, FaEye } from "react-icons/fa"
import { motion } from "framer-motion"
import { resolveProductCardPrice } from "@/lib/storefront/formatPrice"

export interface ProductCardData {
  id: number
  name: string
  slug: string
  basePrice: string | number
  compareAtPrice?: string | number | null
  sku?: string | null
  images: { url: string; isCover: boolean }[]
  isNew?: boolean
  isBestseller?: boolean
  category?: { name: string }
  variants?: { stock: number; price?: number }[]
  colorSwatches?: { value: string; colorHex?: string | null }[]
}

interface ProductCardProps {
  product: ProductCardData
  isFavorite?: boolean
  isAdding?: boolean
  compact?: boolean
  onAddToCart?: (e: React.MouseEvent) => void
  onToggleFavorite?: (e: React.MouseEvent) => void
  onSelect?: () => void
}

function getStockInfo(variants?: { stock: number }[]) {
  if (!variants?.length) return { label: null as string | null, tone: "neutral" as const }
  const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
  if (totalStock <= 0) return { label: "Tükendi", tone: "danger" as const }
  if (totalStock <= 3) return { label: "Son Ürünler", tone: "warning" as const }
  return { label: null, tone: "success" as const }
}

export function ProductCard({
  product,
  isFavorite = false,
  isAdding = false,
  compact = false,
  onAddToCart,
  onToggleFavorite,
  onSelect,
}: ProductCardProps) {
  const coverImage =
    product.images.find((img) => img.isCover)?.url ??
    product.images[0]?.url ??
    "/logo.png"
  const hoverImage = product.images.find((img) => !img.isCover && img.url !== coverImage)?.url ?? null

  const pricing = resolveProductCardPrice(
    Number(product.basePrice),
    product.compareAtPrice != null ? Number(product.compareAtPrice) : null
  )
  const stockInfo = getStockInfo(product.variants)
  const swatches = product.colorSwatches?.slice(0, 4) ?? []
  const extraColors = (product.colorSwatches?.length ?? 0) - swatches.length

  const widthClass = compact
    ? "w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1rem)/3)] md:w-[190px] lg:w-[210px]"
    : "w-full"

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className={`group/card relative flex ${widthClass} shrink-0 flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-card shadow-[0_2px_16px_rgba(35,32,32,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-gold/30 hover:shadow-[0_12px_32px_rgba(35,32,32,0.08)]`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-blush-soft/50">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" draggable={false} onClick={() => onSelect?.()}>
          <Image
            src={coverImage}
            alt={product.name}
            fill
            draggable={false}
            sizes="(max-width: 639px) 46vw, 240px"
            className={`pointer-events-none object-cover transition-opacity duration-500 ${
              hoverImage ? "group-hover/card:opacity-0" : "group-hover/card:scale-105"
            }`}
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              fill
              draggable={false}
              sizes="(max-width: 639px) 46vw, 240px"
              className="pointer-events-none object-cover opacity-0 transition-all duration-500 group-hover/card:scale-105 group-hover/card:opacity-100"
            />
          )}
        </Link>

        <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1">
          {product.isNew && (
            <span className="rounded-lg bg-brand-navy px-2 py-0.5 text-[10px] font-semibold text-white">
              Yeni
            </span>
          )}
          {product.isBestseller && (
            <span className="rounded-lg bg-brand-gold px-2 py-0.5 text-[10px] font-semibold text-white">
              Çok Satan
            </span>
          )}
          {pricing.hasDiscount && pricing.discountPct > 0 && (
            <span className="rounded-lg bg-brand-danger px-2 py-0.5 text-[10px] font-semibold text-white">
              -%{pricing.discountPct}
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            className={`absolute right-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 ${
              isFavorite
                ? "border-brand-gold/30 bg-brand-gold/10 text-brand-gold"
                : "border-brand-border bg-white/95 text-brand-muted hover:text-brand-gold"
            }`}
          >
            {isFavorite ? <FaHeart className="h-3.5 w-3.5" /> : <FaRegHeart className="h-3.5 w-3.5" />}
          </button>
        )}

        {stockInfo.label && (
          <span
            className={`absolute bottom-2.5 left-2.5 z-20 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
              stockInfo.tone === "warning"
                ? "bg-brand-gold/15 text-brand-gold"
                : "bg-brand-muted/15 text-brand-muted"
            }`}
          >
            {stockInfo.label}
          </span>
        )}

        <Link
          href={`/products/${product.slug}`}
          className="absolute bottom-2.5 right-2.5 z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-white/95 text-brand-navy opacity-0 shadow-sm transition-all group-hover/card:opacity-100 md:flex"
          aria-label="Hızlı incele"
        >
          <FaEye className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {product.category && (
          <p className="mb-1 truncate text-[10px] font-medium uppercase tracking-wider text-brand-muted">
            {product.category.name}
          </p>
        )}

        <Link href={`/products/${product.slug}`} className="group/name mb-2 block flex-1">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-brand-text transition-colors group-hover/name:text-brand-gold">
            {product.name}
          </h3>
        </Link>

        {swatches.length > 0 && (
          <div className="mb-2 flex items-center gap-1.5">
            {swatches.map((s) => (
              <span
                key={s.value}
                title={s.value}
                className="h-4 w-4 rounded-full border border-brand-border"
                style={{ background: s.colorHex ?? "#ccc" }}
              />
            ))}
            {extraColors > 0 && (
              <span className="text-[10px] font-medium text-brand-muted">+{extraColors}</span>
            )}
          </div>
        )}

        <div className="mt-auto space-y-2.5">
          <div className="flex flex-wrap items-end gap-2">
            <p className="text-[15px] font-bold text-brand-navy sm:text-[16px]">
              ₺{pricing.current}
            </p>
            {pricing.old && (
              <p className="text-[11px] text-brand-muted line-through">₺{pricing.old}</p>
            )}
          </div>

          {onAddToCart && (
            <button
              type="button"
              disabled={isAdding || stockInfo.tone === "danger"}
              onClick={onAddToCart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy py-2.5 text-[12px] font-semibold text-white transition-all duration-200 hover:bg-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAdding ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <FaShoppingBag className="h-3 w-3" />
              )}
              {isAdding ? "Ekleniyor..." : stockInfo.tone === "danger" ? "Tükendi" : "Sepete Ekle"}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
