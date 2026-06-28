"use client"

import { useEffect, useState } from "react"
import { CART_UPDATED_EVENT } from "@/lib/cartEvents"

interface HeaderCartCountProps {
  showTotal?: boolean
  badgeOnly?: boolean
  className?: string
}

export function HeaderCartCount({ showTotal = false, badgeOnly = false, className = "" }: HeaderCartCountProps) {
  const [count, setCount] = useState<number | null>(null)
  const [subtotal, setSubtotal] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store", credentials: "same-origin" })
        if (cancelled) return
        if (!res.ok) {
          setCount(0)
          setSubtotal(0)
          return
        }
        const data = (await res.json()) as {
          summary?: { itemCount?: number; subtotal?: number }
        }
        setCount(data.summary?.itemCount ?? 0)
        setSubtotal(data.summary?.subtotal ?? 0)
      } catch {
        if (!cancelled) {
          setCount(0)
          setSubtotal(0)
        }
      }
    })()
    const onUpdate = () => {
      void (async () => {
        try {
          const res = await fetch("/api/cart", { cache: "no-store", credentials: "same-origin" })
          if (!res.ok) {
            setCount(0)
            setSubtotal(0)
            return
          }
          const data = (await res.json()) as {
            summary?: { itemCount?: number; subtotal?: number }
          }
          setCount(data.summary?.itemCount ?? 0)
          setSubtotal(data.summary?.subtotal ?? 0)
        } catch {
          setCount(0)
          setSubtotal(0)
        }
      })()
    }
    window.addEventListener(CART_UPDATED_EVENT, onUpdate)
    return () => {
      cancelled = true
      window.removeEventListener(CART_UPDATED_EVENT, onUpdate)
    }
  }, [])

  if (badgeOnly) {
    const badge = count ?? 0
    if (badge <= 0) return null
    return (
      <span
        className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-danger px-1 text-[10px] font-bold text-white ${className}`}
        aria-live="polite"
        suppressHydrationWarning
      >
        {badge}
      </span>
    )
  }

  const itemText = count === null ? "…" : `${count} Ürün`
  const totalText =
    subtotal !== null && subtotal > 0
      ? `₺${subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null

  return (
    <span
      className={`text-[11px] font-semibold text-brand-navy tabular-nums ${className}`}
      aria-live="polite"
      aria-atomic="true"
      suppressHydrationWarning
    >
      {showTotal ? (
        totalText ? (
          <>
            <span className="block">{totalText}</span>
            <span className="block text-[10px] font-medium text-brand-muted">{itemText}</span>
          </>
        ) : (
          itemText
        )
      ) : (
        itemText
      )}
    </span>
  )
}
