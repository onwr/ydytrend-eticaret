"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { RETURN_REASONS } from "@/lib/returnEligibility"
import { trackAnalyticsEventSafe } from "@/lib/analytics/trackSafe"

type OrderItem = {
  id: number
  name: string
  quantity: number
  unitPrice: string
  variantSnapshotJson?: string | null
}

type OrderPayload = {
  order: {
    orderNo: string
    items: OrderItem[]
  }
  actions: {
    canReturn: boolean
    canExchange: boolean
  }
  message?: string
}

type Props = {
  orderNo: string
}

export function ReturnNewClient({ orderNo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<OrderPayload | null>(null)
  const [type, setType] = useState<"RETURN" | "EXCHANGE">("RETURN")
  const [reason, setReason] = useState<string>(RETURN_REASONS[0])
  const [customerNote, setCustomerNote] = useState("")
  const [selected, setSelected] = useState<Record<number, number>>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNo)}`, {
          credentials: "same-origin",
          cache: "no-store",
        })
        if (cancelled) return
        if (res.status === 401) {
          router.replace(`/login?callback=/profil/iade-degisim/yeni?orderNo=${encodeURIComponent(orderNo)}`)
          return
        }
        const json = (await res.json()) as OrderPayload
        if (!res.ok) {
          setError(json.message ?? "Sipariş yüklenemedi.")
          return
        }
        if (!json.actions.canReturn && !json.actions.canExchange) {
          setError("Bu sipariş için iade/değişim talebi oluşturulamaz.")
          return
        }
        setOrderData(json)
        if (json.actions.canExchange && !json.actions.canReturn) {
          setType("EXCHANGE")
        }
        const initial: Record<number, number> = {}
        for (const item of json.order.items) {
          initial[item.id] = 0
        }
        setSelected(initial)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Yüklenemedi.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orderNo, router])

  const toggleQty = (itemId: number, max: number, delta: number) => {
    setSelected((prev) => {
      const next = Math.max(0, Math.min(max, (prev[itemId] ?? 0) + delta))
      return { ...prev, [itemId]: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderData) return

    const items = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({
        orderItemId: Number(orderItemId),
        quantity,
      }))

    if (items.length === 0) {
      setError("En az bir ürün seçin.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          orderNo,
          type,
          reason,
          customerNote: customerNote.trim() || undefined,
          items,
        }),
      })
      const json = (await res.json()) as { message?: string; requestNumber?: string }
      if (!res.ok) {
        setError(json.message ?? "Talep oluşturulamadı.")
        return
      }
      if (json.requestNumber) {
        trackAnalyticsEventSafe("return_request", {
          currency: "TRY",
          transaction_id: orderNo,
        })
        router.push(`/profil/iade-degisim/${encodeURIComponent(json.requestNumber)}`)
      } else {
        router.push("/profil/iade-degisim")
      }
    } catch {
      setError("Bağlantı hatası.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-border border-t-brand-gold" />
      </div>
    )
  }

  if (error && !orderData) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {error}
        <Link href="/profil/iade-degisim" className="mt-3 block font-medium text-brand-gold hover:underline">
          Taleplere dön
        </Link>
      </div>
    )
  }

  if (!orderData) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
          Yeni Talep
        </h1>
        <p className="mt-1 font-mono text-sm text-brand-gold">#{orderData.order.orderNo}</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {orderData.actions.canReturn ? (
          <button
            type="button"
            onClick={() => setType("RETURN")}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition ${
              type === "RETURN"
                ? "bg-brand-navy text-white"
                : "border border-zinc-200 text-zinc-600 hover:border-brand-gold"
            }`}
          >
            İade
          </button>
        ) : null}
        {orderData.actions.canExchange ? (
          <button
            type="button"
            onClick={() => setType("EXCHANGE")}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition ${
              type === "EXCHANGE"
                ? "bg-brand-navy text-white"
                : "border border-zinc-200 text-zinc-600 hover:border-brand-gold"
            }`}
          >
            Değişim
          </button>
        ) : null}
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Neden
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-brand-gold"
        >
          {RETURN_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Ürünler
        </label>
        <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-100">
          {orderData.order.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                <p className="text-xs text-zinc-500">
                  {item.quantity} adet · {item.unitPrice} ₺
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleQty(item.id, item.quantity, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                  {selected[item.id] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => toggleQty(item.id, item.quantity, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600"
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Not (isteğe bağlı)
        </label>
        <textarea
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-zinc-200 p-4 text-sm outline-none focus:border-brand-gold"
          placeholder="Ek açıklama..."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-gold px-8 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-brand-gold/90 disabled:opacity-50"
        >
          {submitting ? "Gönderiliyor..." : "Talebi Gönder"}
        </button>
        <Link
          href="/profil/iade-degisim"
          className="rounded-xl border border-zinc-200 px-6 py-3 text-xs font-black uppercase tracking-widest text-zinc-600"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  )
}
