"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { FaChevronLeft, FaCheck, FaTimes, FaBox, FaCheckCircle, FaSearch } from "react-icons/fa"
import { RETURN_STATUS_LABELS } from "@/lib/returnStatusLabels"
import type { ReturnAdminAction } from "@/lib/returnStatusTransitions"

type ReturnDetail = {
  requestNumber: string
  type: string
  status: keyof typeof RETURN_STATUS_LABELS
  reason: string
  customerNote: string | null
  adminNote: string | null
  refundStatus: string
  refundAmount: string | null
  refundMethod: string | null
  refundReference: string | null
  refundedAt: string | null
  refundNote: string | null
  createdAt: string
  order: { orderNo: string; shippingFullName: string; shippingPhone: string; grandTotal: string }
  user: { name: string; email: string; phone: string | null }
  items: {
    id: number
    quantity: number
    condition: string | null
    orderItem: { name: string; unitPrice: string; lineTotal: string }
  }[]
}

const CONDITIONS = [
  { value: "SELLABLE", label: "Satılabilir" },
  { value: "DAMAGED", label: "Hasarlı" },
  { value: "NEEDS_INSPECTION", label: "İnceleme gerekli" },
] as const

export default function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ requestNumber: string }>
}) {
  const { requestNumber } = use(params)
  const [data, setData] = useState<ReturnDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [adminNote, setAdminNote] = useState("")
  const [itemConditions, setItemConditions] = useState<Record<number, string>>({})
  const [refundForm, setRefundForm] = useState({
    refundStatus: "PENDING",
    refundAmount: "",
    refundMethod: "",
    refundReference: "",
    refundedAt: "",
    refundNote: "",
  })
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)

  const applyDetail = (req: ReturnDetail) => {
    setData(req)
    setAdminNote(req.adminNote ?? "")
    setItemConditions(
      Object.fromEntries(req.items.map((it) => [it.id, it.condition ?? "NEEDS_INSPECTION"]))
    )
    setRefundForm({
      refundStatus: req.refundStatus ?? "PENDING",
      refundAmount: req.refundAmount ?? "",
      refundMethod: req.refundMethod ?? "",
      refundReference: req.refundReference ?? "",
      refundedAt: req.refundedAt ? req.refundedAt.slice(0, 10) : "",
      refundNote: req.refundNote ?? "",
    })
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/admin/returns/${encodeURIComponent(requestNumber)}`)
        const json = await res.json()
        if (cancelled) return
        if (res.ok) applyDetail(json.request)
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [requestNumber])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const runAction = async (action: ReturnAdminAction) => {
    if (!window.confirm(`"${action}" işlemini onaylıyor musunuz?`)) return
    setUpdating(true)
    setEmailWarning(null)
    try {
      const res = await fetch(`/api/admin/returns/${encodeURIComponent(requestNumber)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminNote: adminNote.trim() || undefined,
          itemConditions,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setToast({ msg: json.message ?? "Güncellendi.", ok: true })
        applyDetail(json.request)
      } else {
        setToast({ msg: json.message ?? "Hata.", ok: false })
      }
    } catch {
      setToast({ msg: "Bağlantı hatası.", ok: false })
    } finally {
      setUpdating(false)
    }
  }

  const saveRefund = async () => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/returns/${encodeURIComponent(requestNumber)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_refund",
          refundStatus: refundForm.refundStatus,
          refundAmount: refundForm.refundAmount ? Number(refundForm.refundAmount) : undefined,
          refundMethod: refundForm.refundMethod || undefined,
          refundReference: refundForm.refundReference || undefined,
          refundedAt: refundForm.refundedAt || undefined,
          refundNote: refundForm.refundNote || undefined,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setToast({ msg: json.message ?? "Finansal bilgi kaydedildi.", ok: true })
        applyDetail(json.request)
      } else {
        setToast({ msg: json.message ?? "Hata.", ok: false })
      }
    } catch {
      setToast({ msg: "Bağlantı hatası.", ok: false })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-[#38BDF8]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        Talep bulunamadı.
        <Link href="/admin/returns" className="mt-2 block text-[#38BDF8]">
          Listeye dön
        </Link>
      </div>
    )
  }

  const canReview = data.status === "PENDING"
  const canApprove = ["PENDING", "UNDER_REVIEW", "APPROVED"].includes(data.status)
  const canReject = ["PENDING", "UNDER_REVIEW", "APPROVED", "WAITING_FOR_PRODUCT"].includes(
    data.status
  )
  const canProductReceived = ["APPROVED", "WAITING_FOR_PRODUCT"].includes(data.status)
  const canComplete = data.status === "PRODUCT_RECEIVED"
  const refundLocked = data.status === "COMPLETED" && data.refundStatus === "COMPLETED"

  return (
    <div className="space-y-6 pb-10">
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm shadow-lg ${
            toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      ) : null}

      {emailWarning ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-800">
          {emailWarning}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/returns"
          className="flex items-center gap-2 text-[12px] text-zinc-400 hover:text-zinc-700"
        >
          <FaChevronLeft className="h-3 w-3" /> Talepler
        </Link>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-700">
          {RETURN_STATUS_LABELS[data.status]}
        </span>
      </div>

      <div>
        <h1 className="font-mono text-lg font-semibold text-zinc-800">{data.requestNumber}</h1>
        <p className="text-[12px] text-zinc-400">
          #{data.order.orderNo} · {data.type === "EXCHANGE" ? "Değişim" : "İade"} · {data.reason}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-100 bg-white p-4">
          <p className="text-[10px] font-medium uppercase text-zinc-400">Müşteri</p>
          <p className="mt-1 text-sm font-medium text-zinc-800">{data.user.name}</p>
          <p className="text-[12px] text-zinc-500">{data.user.email}</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-white p-4">
          <p className="text-[10px] font-medium uppercase text-zinc-400">Teslimat</p>
          <p className="mt-1 text-sm text-zinc-800">{data.order.shippingFullName}</p>
          <p className="text-[12px] text-zinc-500">{data.order.shippingPhone}</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-800">Ürünler ve durum</h2>
        <ul className="mt-3 divide-y divide-zinc-50 text-[12.5px]">
          {data.items.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <div>
                <span>{row.orderItem.name}</span>
                <span className="ml-2 tabular-nums text-zinc-500">
                  {row.quantity} × {row.orderItem.unitPrice} ₺
                </span>
              </div>
              <select
                value={itemConditions[row.id] ?? "NEEDS_INSPECTION"}
                onChange={(e) =>
                  setItemConditions((prev) => ({ ...prev, [row.id]: e.target.value }))
                }
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-1 text-[11px]"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </div>

      {data.type === "RETURN" ? (
        <div className="rounded-xl border border-zinc-100 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-800">Finansal iade (manuel)</h2>
          <p className="mt-1 text-[11px] text-zinc-400">
            BANK_TRANSFER ve diğer yöntemler manuel işlenir. Referans audit log&apos;da maskelenir.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase text-zinc-400">Durum</label>
              <select
                disabled={refundLocked}
                value={refundForm.refundStatus}
                onChange={(e) => setRefundForm((f) => ({ ...f, refundStatus: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-2 text-[12px]"
              >
                {["NOT_REQUIRED", "PENDING", "MANUAL_PROCESSING", "COMPLETED", "FAILED"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-zinc-400">Tutar (₺)</label>
              <input
                disabled={refundLocked}
                type="number"
                min={0}
                step="0.01"
                value={refundForm.refundAmount}
                onChange={(e) => setRefundForm((f) => ({ ...f, refundAmount: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-2 text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-zinc-400">Yöntem</label>
              <input
                disabled={refundLocked}
                value={refundForm.refundMethod}
                onChange={(e) => setRefundForm((f) => ({ ...f, refundMethod: e.target.value }))}
                placeholder="BANK_TRANSFER"
                className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-2 text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-zinc-400">Referans</label>
              <input
                disabled={refundLocked}
                value={refundForm.refundReference}
                onChange={(e) => setRefundForm((f) => ({ ...f, refundReference: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-2 text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-zinc-400">İade tarihi</label>
              <input
                disabled={refundLocked}
                type="date"
                value={refundForm.refundedAt}
                onChange={(e) => setRefundForm((f) => ({ ...f, refundedAt: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-2 text-[12px]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase text-zinc-400">Not</label>
              <textarea
                disabled={refundLocked}
                value={refundForm.refundNote}
                onChange={(e) => setRefundForm((f) => ({ ...f, refundNote: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-100 bg-zinc-50 p-2 text-[12px]"
              />
            </div>
          </div>
          {!refundLocked ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => void saveRefund()}
              className="mt-3 rounded-lg bg-zinc-800 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
            >
              Finansal bilgiyi kaydet
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-100 bg-white p-4">
        <label className="text-[10px] font-medium uppercase text-zinc-400">Admin notu</label>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-[12.5px] outline-none focus:border-[#38BDF8]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {canReview ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => void runAction("review")}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
          >
            <FaSearch className="h-3 w-3" /> İncelemeye al
          </button>
        ) : null}
        {canApprove ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => void runAction("approve")}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
          >
            <FaCheck className="h-3 w-3" /> Onayla
          </button>
        ) : null}
        {canReject ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => void runAction("reject")}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
          >
            <FaTimes className="h-3 w-3" /> Reddet
          </button>
        ) : null}
        {canProductReceived ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => void runAction("product_received")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
          >
            <FaBox className="h-3 w-3" /> Ürün alındı
          </button>
        ) : null}
        {canComplete ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => void runAction("complete")}
            className="flex items-center gap-2 rounded-lg bg-[#38BDF8] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
          >
            <FaCheckCircle className="h-3 w-3" /> Tamamla
          </button>
        ) : null}
      </div>
    </div>
  )
}
