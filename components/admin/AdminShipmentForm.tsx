"use client"

import { useState } from "react"
import { FaTruck, FaSave } from "react-icons/fa"

type ShipmentData = {
  cargoCompany?: string | null
  trackingNo?: string | null
  trackingUrl?: string | null
  estimatedDeliveryDate?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
}

function toInputDate(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function toInputDateTime(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AdminShipmentForm({
  orderNo,
  orderStatus,
  shipment,
  onSaved,
}: {
  orderNo: string
  orderStatus: string
  shipment: ShipmentData | null | undefined
  onSaved: () => void
}) {
  const [cargoCompany, setCargoCompany] = useState(shipment?.cargoCompany ?? "")
  const [trackingNo, setTrackingNo] = useState(shipment?.trackingNo ?? "")
  const [trackingUrl, setTrackingUrl] = useState(shipment?.trackingUrl ?? "")
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    toInputDate(shipment?.estimatedDeliveryDate)
  )
  const [shippedAt, setShippedAt] = useState(toInputDateTime(shipment?.shippedAt))
  const [deliveredAt, setDeliveredAt] = useState(toInputDateTime(shipment?.deliveredAt))
  const [markShipped, setMarkShipped] = useState(false)
  const [markDelivered, setMarkDelivered] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const terminal = ["CANCELLED", "REFUNDED"].includes(orderStatus)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}/shipment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargoCompany: cargoCompany.trim() || undefined,
          trackingNo: trackingNo.trim() || undefined,
          trackingUrl: trackingUrl.trim() || undefined,
          estimatedDeliveryDate: estimatedDeliveryDate || undefined,
          shippedAt: shippedAt || undefined,
          deliveredAt: deliveredAt || undefined,
          markShipped,
          markDelivered,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: data.message ?? "Kargo bilgisi kaydedildi.", ok: true })
        setMarkShipped(false)
        setMarkDelivered(false)
        onSaved()
      } else {
        setMessage({ text: data.message ?? "Kaydedilemedi.", ok: false })
      }
    } catch {
      setMessage({ text: "Bağlantı hatası.", ok: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-xl border border-zinc-100 bg-white p-4 no-print">
      <div className="mb-3 flex items-center gap-2">
        <FaTruck className="h-3.5 w-3.5 text-[#38BDF8]" />
        <p className="text-[12px] font-medium text-zinc-600">Kargo Bilgisi</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-medium uppercase text-zinc-400">Kargo firması</label>
          <input
            value={cargoCompany}
            onChange={(e) => setCargoCompany(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-[12px] outline-none focus:border-[#38BDF8]"
            placeholder="Yurtiçi, Aras..."
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase text-zinc-400">Takip numarası</label>
          <input
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-[12px] outline-none focus:border-[#38BDF8]"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase text-zinc-400">Takip URL (http/https)</label>
          <input
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-[12px] outline-none focus:border-[#38BDF8]"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase text-zinc-400">Tahmini teslim</label>
          <input
            type="date"
            value={estimatedDeliveryDate}
            onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-[12px] outline-none focus:border-[#38BDF8]"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase text-zinc-400">Kargoya verildi</label>
          <input
            type="datetime-local"
            value={shippedAt}
            onChange={(e) => setShippedAt(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-[12px] outline-none focus:border-[#38BDF8]"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase text-zinc-400">Teslim edildi</label>
          <input
            type="datetime-local"
            value={deliveredAt}
            onChange={(e) => setDeliveredAt(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-[12px] outline-none focus:border-[#38BDF8]"
          />
        </div>

        {!terminal && (
          <div className="flex flex-col gap-2 border-t border-zinc-50 pt-3">
            <label className="flex items-center gap-2 text-[11.5px] text-zinc-600">
              <input
                type="checkbox"
                checked={markShipped}
                onChange={(e) => {
                  setMarkShipped(e.target.checked)
                  if (e.target.checked) setMarkDelivered(false)
                }}
              />
              Kargoya verildi olarak işaretle (SHIPPED)
            </label>
            <label className="flex items-center gap-2 text-[11.5px] text-zinc-600">
              <input
                type="checkbox"
                checked={markDelivered}
                onChange={(e) => {
                  setMarkDelivered(e.target.checked)
                  if (e.target.checked) setMarkShipped(false)
                }}
              />
              Teslim edildi olarak işaretle (DELIVERED)
            </label>
          </div>
        )}

        {message ? (
          <p
            className={`text-[11px] ${message.ok ? "text-emerald-600" : "text-rose-600"}`}
            role="status"
          >
            {message.text}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#38BDF8] px-3 py-2 text-[12px] font-medium text-white disabled:opacity-50"
        >
          <FaSave className="h-3 w-3" />
          {saving ? "Kaydediliyor..." : "Kargo bilgisini kaydet"}
        </button>
      </div>
    </form>
  )
}
