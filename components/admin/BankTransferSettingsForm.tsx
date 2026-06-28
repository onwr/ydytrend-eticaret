"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type FormState = {
  accountHolder: string
  bankName: string
  iban: string
  transferNote: string
}

export function BankTransferSettingsForm({ layout = "page" }: { layout?: "page" | "embedded" }) {
  const [form, setForm] = useState<FormState>({
    accountHolder: "",
    bankName: "",
    iban: "",
    transferNote: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/bank-transfer")
      .then((r) => r.json())
      .then((d) => {
        if (d.accountHolder !== undefined) {
          setForm({
            accountHolder: d.accountHolder ?? "",
            bankName: d.bankName ?? "",
            iban: d.iban ?? "",
            transferNote: d.transferNote ?? "",
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/bank-transfer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Kaydedilemedi.")
      setMessage({ ok: true, text: "Banka bilgileri kaydedildi." })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Kaydedilemedi." })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Yükleniyor...</p>
  }

  return (
    <div className={layout === "page" ? "space-y-6" : ""}>
      {layout === "page" && (
        <div>
          <h1 className="text-[17px] font-medium text-zinc-800">Havale / EFT Hesabı</h1>
          <p className="mt-1 text-[12px] text-zinc-500">
            Checkout ve ödeme talimatlarında gösterilecek IBAN bilgileri.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-[12px] ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-zinc-100 bg-white p-5">
        <Field label="Hesap sahibi" value={form.accountHolder} onChange={(v) => setForm((f) => ({ ...f, accountHolder: v }))} />
        <Field label="Banka adı" value={form.bankName} onChange={(v) => setForm((f) => ({ ...f, bankName: v }))} />
        <Field
          label="IBAN"
          value={form.iban}
          onChange={(v) => setForm((f) => ({ ...f, iban: v.toUpperCase().replace(/\s/g, "") }))}
          placeholder="TR00..."
          mono
        />
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">Müşteri notu</label>
          <textarea
            value={form.transferNote}
            onChange={(e) => setForm((f) => ({ ...f, transferNote: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] outline-none focus:border-[#38BDF8]"
          />
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      {layout === "page" && (
        <p className="text-[11px] text-zinc-400">
          Müşteriler ödeme sonrası dekont yükler; onayı{" "}
          <Link href="/admin/orders" className="text-[#38BDF8] hover:underline">
            sipariş detayından
          </Link>{" "}
          yapabilirsiniz.
        </p>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-zinc-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full rounded-lg border border-zinc-200 px-3 text-[13px] outline-none focus:border-[#38BDF8] ${mono ? "font-mono" : ""}`}
      />
    </div>
  )
}
