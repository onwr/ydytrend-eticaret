"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { RETURN_STATUS_LABELS } from "@/lib/returnStatusTransitions"
import { ReturnListSkeleton } from "@/components/ui/skeletons/ReturnListSkeleton"

type ReturnRow = {
  requestNumber: string
  type: string
  status: keyof typeof RETURN_STATUS_LABELS
  reason: string
  createdAt: string
  order: { orderNo: string }
  items: { orderItem: { name: string } }[]
}

export function ReturnsListClient() {
  const router = useRouter()
  const [items, setItems] = useState<ReturnRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/returns", { credentials: "same-origin", cache: "no-store" })
        if (cancelled) return
        if (res.status === 401) {
          router.replace("/login?callback=/profil/iade-degisim")
          return
        }
        const json = (await res.json()) as { items?: ReturnRow[]; message?: string }
        if (!res.ok) throw new Error(json.message ?? "Yüklenemedi.")
        setItems(json.items ?? [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Yüklenemedi.")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
            İade ve Değişim
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
            Taleplerinizi buradan takip edin
          </p>
        </div>
        <Link
          href="/profil?tab=siparisler"
          className="rounded-xl border border-brand-gold px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-brand-gold transition hover:bg-brand-gold hover:text-white"
        >
          Siparişlerim
        </Link>
      </div>

      {items === null && !error ? <ReturnListSkeleton /> : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {items && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <p className="text-sm font-bold text-zinc-500">Henüz iade/değişim talebiniz yok.</p>
          <p className="mt-2 text-xs text-zinc-400">
            Teslim edilmiş siparişlerinizden talep oluşturabilirsiniz.
          </p>
        </div>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((row) => (
            <li key={row.requestNumber}>
              <Link
                href={`/profil/iade-degisim/${encodeURIComponent(row.requestNumber)}`}
                className="block rounded-xl border border-zinc-100 bg-white p-4 transition hover:border-brand-gold/40 hover:shadow-md md:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-brand-navy">
                      {row.requestNumber}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Sipariş #{row.order.orderNo} ·{" "}
                      {new Date(row.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700">
                      {row.type === "EXCHANGE" ? "Değişim" : "İade"} · {row.reason}
                    </p>
                    {row.items[0] ? (
                      <p className="mt-1 text-xs text-zinc-400">
                        {row.items[0].orderItem.name}
                        {row.items.length > 1 ? ` +${row.items.length - 1} ürün` : ""}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-navy">
                    {RETURN_STATUS_LABELS[row.status] ?? row.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
