"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { TimelineStep } from "@/lib/orderTimeline"
import { orderStatusLabel } from "@/lib/orderStatusLabels"
import { CANCEL_REASONS } from "@/lib/returnEligibility"
import { OrderListSkeleton } from "@/components/ui/skeletons/OrderListSkeleton"

type OrderDetailJson = {
  order: {
    orderNo: string
    createdAt: string
    status: string
    paymentStatus: string
    subtotal: string
    shippingCost: string
    grandTotal: string
    note: string | null
    shippingFullName: string
    shippingPhone: string
    shippingLine1: string
    shippingLine2: string | null
    shippingDistrict: string
    shippingCity: string
    shippingPostalCode: string
    shippingCountry: string
    items: {
      id?: number
      name: string
      sku: string | null
      variantSku?: string | null
      variantSnapshotJson?: string | null
      unitPrice: string
      quantity: number
      lineTotal: string
    }[]
    payments: { method: string; status: string; amount: string; createdAt: string }[]
    shipment: {
      cargoCompany: string | null
      trackingNo: string | null
      trackingUrl: string | null
      shippedAt: string | null
      deliveredAt: string | null
    } | null
    returnRequests?: { requestNumber: string; status: string; type: string }[]
  }
  timeline: TimelineStep[]
  actions: {
    canCancel: boolean
    canReturn: boolean
    canExchange: boolean
    returnWindowDays: number
    exchangeWindowDays: number
  }
  message?: string
}

type Props = {
  orderNo: string
}

export function OrderDetailClient({ orderNo }: Props) {
  const router = useRouter()
  const [payload, setPayload] = useState<OrderDetailJson | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0])
  const [cancelNote, setCancelNote] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [cancelMsg, setCancelMsg] = useState<string | null>(null)

  const reload = async () => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderNo)}`, {
      credentials: "same-origin",
      cache: "no-store",
    })
    const json = (await res.json()) as OrderDetailJson
    if (res.ok && json.order) {
      setPayload(json)
    }
  }

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
          router.replace(`/login?callbackUrl=/siparislerim/${encodeURIComponent(orderNo)}`)
          return
        }
        const json = (await res.json()) as OrderDetailJson
        if (res.status === 404) {
          setError(json.message ?? "Sipariş bulunamadı.")
          return
        }
        if (!res.ok || !json.order) {
          throw new Error(json.message ?? "Yüklenemedi.")
        }
        setPayload(json)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Yüklenemedi.")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orderNo, router])

  const handleCancel = async () => {
    setCancelling(true)
    setCancelMsg(null)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNo)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          confirm: true,
          reason: cancelReason,
          note: cancelNote.trim() || undefined,
        }),
      })
      const json = (await res.json()) as { message?: string }
      if (!res.ok) {
        setCancelMsg(json.message ?? "İptal edilemedi.")
        return
      }
      setShowCancel(false)
      setCancelMsg(json.message ?? "Sipariş iptal edildi.")
      await reload()
    } catch {
      setCancelMsg("Bağlantı hatası.")
    } finally {
      setCancelling(false)
    }
  }

  if (!payload && !error) {
    return <OrderListSkeleton rows={3} />
  }

  if (error || !payload) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-800">
        {error ?? "Sipariş bulunamadı."}
        <Link href="/siparislerim" className="mt-3 block font-medium text-brand-gold hover:underline">
          Sipariş listesine dön
        </Link>
      </div>
    )
  }

  const { order: o, timeline, actions } = payload
  const statusLabel =
    orderStatusLabel(o.status)

  return (
    <div className="space-y-6">
      {cancelMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {cancelMsg}
        </div>
      ) : null}

      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2 md:p-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Sipariş</h2>
          <p className="mt-1 font-mono text-sm">{o.orderNo}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {new Date(o.createdAt).toLocaleString("tr-TR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Durum: <strong>{statusLabel}</strong> · Ödeme: <strong>{o.paymentStatus}</strong>
          </p>
        </div>
        <div className="text-sm text-zinc-700">
          <p>
            Ara toplam: <span className="tabular-nums">{o.subtotal} ₺</span>
          </p>
          <p>
            Kargo: <span className="tabular-nums">{o.shippingCost} ₺</span>
          </p>
          <p className="mt-2 text-base font-semibold text-zinc-900">
            Genel toplam: <span className="tabular-nums">{o.grandTotal} ₺</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Sipariş durumu</h2>
        <ol className="mt-4 space-y-0">
          {timeline.map((step, i) => (
            <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
              {i < timeline.length - 1 ? (
                <span
                  className={`absolute left-[11px] top-6 h-full w-0.5 ${
                    step.done ? "bg-brand-gold/40" : "bg-zinc-100"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  step.current
                    ? "bg-brand-gold text-white ring-4 ring-brand-gold/20"
                    : step.done
                      ? "bg-brand-navy text-white"
                      : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <div>
                <p
                  className={`text-sm font-medium ${
                    step.current ? "text-brand-navy" : step.done ? "text-zinc-800" : "text-zinc-400"
                  }`}
                >
                  {step.label}
                </p>
                {step.at ? (
                  <p className="text-xs text-zinc-500">
                    {new Date(step.at).toLocaleString("tr-TR")}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {(actions.canCancel || actions.canReturn || actions.canExchange) && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-4">
          {actions.canCancel ? (
            <button
              type="button"
              onClick={() => setShowCancel((v) => !v)}
              className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Siparişi iptal et
            </button>
          ) : null}
          {actions.canReturn ? (
            <Link
              href={`/profil/iade-degisim/yeni?orderNo=${encodeURIComponent(o.orderNo)}`}
              className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy/90"
            >
              İade talebi oluştur
            </Link>
          ) : null}
          {actions.canExchange ? (
            <Link
              href={`/profil/iade-degisim/yeni?orderNo=${encodeURIComponent(o.orderNo)}`}
              className="rounded-lg border border-brand-navy px-4 py-2 text-sm font-medium text-brand-navy hover:bg-brand-navy/5"
            >
              Değişim talebi oluştur
            </Link>
          ) : null}
        </div>
      )}

      {showCancel ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <h3 className="text-sm font-semibold text-rose-900">İptal onayı</h3>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="mt-3 h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm"
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            placeholder="Ek not (isteğe bağlı)"
            rows={2}
            className="mt-2 w-full rounded-lg border border-rose-200 bg-white p-3 text-sm"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={cancelling}
              onClick={() => void handleCancel()}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {cancelling ? "İptal ediliyor..." : "İptali onayla"}
            </button>
            <button
              type="button"
              onClick={() => setShowCancel(false)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}

      {o.returnRequests && o.returnRequests.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
          <h2 className="text-sm font-semibold text-zinc-900">İade / değişim talepleri</h2>
          <ul className="mt-2 space-y-2">
            {o.returnRequests.map((r) => (
              <li key={r.requestNumber}>
                <Link
                  href={`/profil/iade-degisim/${encodeURIComponent(r.requestNumber)}`}
                  className="text-sm font-medium text-brand-gold hover:underline"
                >
                  {r.requestNumber} — {r.type === "EXCHANGE" ? "Değişim" : "İade"} ({r.status})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Teslimat</h2>
        <p className="mt-2 text-sm text-zinc-700">
          {o.shippingFullName} · {o.shippingPhone}
        </p>
        <p className="text-sm text-zinc-700">
          {o.shippingLine1}
          {o.shippingLine2 ? `, ${o.shippingLine2}` : ""}
        </p>
        <p className="text-sm text-zinc-700">
          {o.shippingDistrict} / {o.shippingCity} {o.shippingPostalCode} · {o.shippingCountry}
        </p>
      </div>

      {o.shipment?.trackingNo || o.shipment?.cargoCompany ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Kargo takibi</h2>
          <p className="mt-2 text-sm text-zinc-700">
            {o.shipment.cargoCompany ?? "—"}
            {o.shipment.trackingNo ? ` · Takip no: ${o.shipment.trackingNo}` : ""}
          </p>
          {o.shipment.shippedAt ? (
            <p className="text-xs text-zinc-500">
              Kargoya verildi: {new Date(o.shipment.shippedAt).toLocaleString("tr-TR")}
            </p>
          ) : null}
          {o.shipment.deliveredAt ? (
            <p className="text-xs text-zinc-500">
              Teslim: {new Date(o.shipment.deliveredAt).toLocaleString("tr-TR")}
            </p>
          ) : null}
          {o.shipment.trackingUrl ? (
            <a
              href={o.shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-brand-gold hover:underline"
            >
              Kargo takibini görüntüle →
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Ürünler</h2>
        <ul className="mt-3 divide-y divide-zinc-100">
          {o.items.map((item, idx: number) => {
            let snapshotAttrs: { name: string; value: string; colorHex?: string | null }[] = []
            if (item.variantSnapshotJson) {
              try {
                snapshotAttrs = JSON.parse(item.variantSnapshotJson)
              } catch {
                /* ignore */
              }
            }
            return (
              <li key={item.id ?? idx} className="py-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-zinc-800">
                    {item.name}
                    {item.variantSku ? (
                      <span className="ml-2 text-xs text-zinc-500">SKU: {item.variantSku}</span>
                    ) : item.sku ? (
                      <span className="ml-2 text-xs text-zinc-500">SKU: {item.sku}</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-zinc-700">
                    {item.quantity} × {item.unitPrice} ₺ = {item.lineTotal} ₺
                  </span>
                </div>
                {snapshotAttrs.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {snapshotAttrs.map((a) => (
                      <span
                        key={a.name}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500"
                      >
                        {a.colorHex && (
                          <span
                            className="inline-block h-2 w-2 rounded-full border border-zinc-200"
                            style={{ background: a.colorHex }}
                          />
                        )}
                        {a.name}: <strong className="text-zinc-700">{a.value}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Ödeme kayıtları</h2>
        <ul className="mt-2 space-y-1 text-sm text-zinc-700">
          {o.payments.map((p, i) => (
            <li key={`${p.createdAt}-${i}`}>
              {p.method} — {p.status} — {p.amount} ₺
            </li>
          ))}
        </ul>
      </div>

      {o.note ? (
        <p className="text-sm text-zinc-600">
          <strong>Not:</strong> {o.note}
        </p>
      ) : null}

      <Link href="/siparislerim" className="inline-block text-sm font-medium text-brand-gold hover:underline">
        Tüm siparişler
      </Link>
    </div>
  )
}
