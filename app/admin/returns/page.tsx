"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FaEye, FaSearch, FaUndo } from "react-icons/fa"
import { RETURN_STATUS_LABELS } from "@/lib/returnStatusLabels"
import { ReturnListSkeleton } from "@/components/ui/skeletons/ReturnListSkeleton"

type ReturnRow = {
  requestNumber: string
  type: string
  status: keyof typeof RETURN_STATUS_LABELS
  reason: string
  createdAt: string
  order: { orderNo: string }
  user: { name: string; email: string }
  items: { id: number }[]
}

const STATUS_OPTIONS = ["ALL", ...Object.keys(RETURN_STATUS_LABELS)]

export default function AdminReturnsPage() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<ReturnRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "ALL")
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("type") ?? "ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          status,
          type: typeFilter,
          q: search,
        })
        const res = await fetch(`/api/admin/returns?${params}`)
        const data = await res.json()
        if (cancelled) return
        if (res.ok) {
          setItems(data.items ?? [])
          setTotalPages(data.pagination?.totalPages ?? 1)
          setTotalCount(data.pagination?.totalCount ?? 0)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, status, typeFilter, search])

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-[17px] font-medium text-zinc-800">İade ve Değişim</h1>
        <p className="text-[12px] text-zinc-400">
          {totalCount > 0 ? `${totalCount} talep` : "Müşteri iade/değişim talepleri"}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-white p-4 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
          }}
        >
          <FaSearch className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Talep no, sipariş no, müşteri..."
            className="h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 pl-9 pr-4 text-[12.5px] outline-none focus:border-[#38BDF8] focus:bg-white"
          />
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-[12px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "Tüm durumlar" : RETURN_STATUS_LABELS[s as keyof typeof RETURN_STATUS_LABELS]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white">
        {loading ? (
          <div className="p-4">
            <ReturnListSkeleton />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-zinc-300">
            <FaUndo className="h-10 w-10" />
            <p className="text-[12px] text-zinc-400">Talep bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-zinc-100 bg-zinc-50/60 text-[10.5px] text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Talep No</th>
                  <th className="px-5 py-3">Sipariş</th>
                  <th className="px-5 py-3">Müşteri</th>
                  <th className="px-5 py-3">Tür</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map((row) => (
                  <tr key={row.requestNumber} className="hover:bg-zinc-50/70">
                    <td className="px-5 py-4 font-mono font-medium text-zinc-700">
                      {row.requestNumber}
                    </td>
                    <td className="px-5 py-4">#{row.order.orderNo}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-800">{row.user.name}</p>
                      <p className="text-[11px] text-zinc-400">{row.user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {row.type === "EXCHANGE" ? "Değişim" : "İade"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                        {RETURN_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-500">
                      {new Date(row.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/returns/${encodeURIComponent(row.requestNumber)}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-100 text-zinc-400 hover:border-[#38BDF8] hover:text-[#38BDF8]"
                      >
                        <FaEye className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-[11px] text-zinc-400">
            <span>
              Sayfa {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-200 px-3 py-1 disabled:opacity-40"
              >
                Önceki
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-200 px-3 py-1 disabled:opacity-40"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
