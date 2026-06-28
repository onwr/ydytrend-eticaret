"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { returnStatusLabel } from "@/lib/returnStatusLabels"

type ReturnDetail = {
  requestNumber: string
  type: string
  status: string
  reason: string
  customerNote: string | null
  adminNote: string | null
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  completedAt: string | null
  order: { orderNo: string; status: string }
  items: {
    quantity: number
    reason: string | null
    orderItem: {
      name: string
      sku: string | null
      variantSku: string | null
      unitPrice: string
    }
  }[]
}

type Props = {
  requestNumber: string
}

export function ReturnDetailClient({ requestNumber }: Props) {
  const router = useRouter()
  const [data, setData] = useState<ReturnDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/returns/${encodeURIComponent(requestNumber)}`, {
          credentials: "same-origin",
          cache: "no-store",
        })
        if (cancelled) return
        if (res.status === 401) {
          router.replace(
            `/login?callback=/profil/iade-degisim/${encodeURIComponent(requestNumber)}`
          )
          return
        }
        const json = (await res.json()) as { request?: ReturnDetail; message?: string }
        if (res.status === 404) {
          setError(json.message ?? "Talep bulunamadı.")
          return
        }
        if (!res.ok) throw new Error(json.message ?? "Yüklenemedi.")
        setData(json.request ?? null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Yüklenemedi.")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [requestNumber, router])

  if (!data && !error) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-border border-t-brand-gold" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {error ?? "Talep bulunamadı."}
        <Link href="/profil/iade-degisim" className="mt-3 block font-medium text-brand-gold hover:underline">
          Taleplere dön
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/profil/iade-degisim"
            className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-brand-gold"
          >
            ← Talepler
          </Link>
          <h1 className="mt-2 font-mono text-xl font-semibold text-brand-navy">{data.requestNumber}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sipariş #{data.order.orderNo} ·{" "}
            {data.type === "EXCHANGE" ? "Değişim" : "İade"}
          </p>
        </div>
        <span className="rounded-full bg-brand-navy px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
          {returnStatusLabel(data.status)}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Neden</p>
          <p className="mt-1 text-sm text-zinc-800">{data.reason}</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tarih</p>
          <p className="mt-1 text-sm text-zinc-800">
            {new Date(data.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>
      </div>

      {data.customerNote ? (
        <div className="rounded-xl border border-zinc-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Notunuz</p>
          <p className="mt-1 text-sm text-zinc-700">{data.customerNote}</p>
        </div>
      ) : null}

      {data.adminNote ? (
        <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
            Mağaza yanıtı
          </p>
          <p className="mt-1 text-sm text-zinc-700">{data.adminNote}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-100 p-4 md:p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Ürünler</h2>
        <ul className="mt-3 divide-y divide-zinc-100">
          {data.items.map((row, i) => (
            <li key={i} className="flex justify-between py-3 text-sm">
              <span className="text-zinc-800">
                {row.orderItem.name}
                {row.orderItem.variantSku || row.orderItem.sku ? (
                  <span className="ml-2 text-xs text-zinc-400">
                    SKU: {row.orderItem.variantSku ?? row.orderItem.sku}
                  </span>
                ) : null}
              </span>
              <span className="tabular-nums text-zinc-600">
                {row.quantity} × {row.orderItem.unitPrice} ₺
              </span>
            </li>
          ))}
        </ul>
      </div>

      {(data.approvedAt || data.rejectedAt || data.completedAt) && (
        <div className="rounded-xl border border-zinc-100 p-4 text-xs text-zinc-500">
          {data.approvedAt ? (
            <p>Onay: {new Date(data.approvedAt).toLocaleString("tr-TR")}</p>
          ) : null}
          {data.rejectedAt ? (
            <p>Red: {new Date(data.rejectedAt).toLocaleString("tr-TR")}</p>
          ) : null}
          {data.completedAt ? (
            <p>Tamamlandı: {new Date(data.completedAt).toLocaleString("tr-TR")}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
