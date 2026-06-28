"use client"

import { useState, useEffect, useCallback } from "react"
import { FaPlus, FaTrash, FaPencilAlt, FaTimes, FaCheck, FaChevronDown, FaChevronRight } from "react-icons/fa"

// ── Tipler ───────────────────────────────────────────────────────────────────

type AttributeType = "SELECT" | "COLOR" | "SIZE" | "MATERIAL" | "TEXT"

type AttributeValue = {
  id: number
  attributeId: number
  value: string
  slug: string
  colorHex?: string | null
  sortOrder: number
  isActive: boolean
}

type Attribute = {
  id: number
  name: string
  slug: string
  type: AttributeType
  isVariant: boolean
  isFilterable: boolean
  isActive: boolean
  sortOrder: number
  values: AttributeValue[]
  _count?: { categoryAttributes: number }
}

const TYPE_LABELS: Record<AttributeType, string> = {
  SELECT: "Seçim",
  COLOR: "Renk",
  SIZE: "Beden/Ölçü",
  MATERIAL: "Materyal",
  TEXT: "Metin",
}

const TYPE_COLORS: Record<AttributeType, string> = {
  SELECT: "bg-blue-100 text-blue-700",
  COLOR: "bg-pink-100 text-pink-700",
  SIZE: "bg-purple-100 text-purple-700",
  MATERIAL: "bg-amber-100 text-amber-700",
  TEXT: "bg-zinc-100 text-zinc-600",
}

// ── Slug yardımcısı ───────────────────────────────────────────────────────────

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, ok, onDone }: { msg: string; ok: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl text-sm font-semibold text-white
        ${ok ? "bg-emerald-600" : "bg-red-600"}`}
    >
      {ok ? <FaCheck className="h-3.5 w-3.5" /> : <FaTimes className="h-3.5 w-3.5" />}
      {msg}
    </div>
  )
}

// ── Ana Bileşen ───────────────────────────────────────────────────────────────

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Yeni özellik formu
  const [newAttr, setNewAttr] = useState({
    name: "",
    slug: "",
    type: "SELECT" as AttributeType,
    isVariant: true,
    isFilterable: false,
  })
  const [showNewAttr, setShowNewAttr] = useState(false)
  const [savingAttr, setSavingAttr] = useState(false)

  // Düzenleme formu
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")

  // Yeni değer formu
  const [newValueMap, setNewValueMap] = useState<
    Record<number, { value: string; slug: string; colorHex: string }>
  >({})
  const [savingValue, setSavingValue] = useState<number | null>(null)

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/attributes")
      const d = await r.json()
      setAttributes(d.items ?? [])
    } catch {
      showToast("Özellikler yüklenemedi.", false)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const r = await fetch("/api/admin/attributes")
        const d = await r.json()
        if (!cancelled) setAttributes(d.items ?? [])
      } catch {
        if (!cancelled) showToast("Özellikler yüklenemedi.", false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showToast])

  // Yeni özellik kaydet
  const saveAttribute = async () => {
    if (!newAttr.name.trim()) return
    setSavingAttr(true)
    try {
      const r = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAttr,
          slug: newAttr.slug || toSlug(newAttr.name),
        }),
      })
      if (!r.ok) {
        const d = await r.json()
        showToast(d.message || "Hata oluştu.", false)
        return
      }
      showToast("Özellik eklendi.", true)
      setNewAttr({ name: "", slug: "", type: "SELECT", isVariant: true, isFilterable: false })
      setShowNewAttr(false)
      load()
    } finally {
      setSavingAttr(false)
    }
  }

  // Özelliği aktif/pasif et
  const toggleActive = async (attr: Attribute) => {
    await fetch(`/api/admin/attributes/${attr.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !attr.isActive }),
    })
    load()
  }

  // Özelliği sil
  const deleteAttribute = async (attr: Attribute) => {
    if (!confirm(`"${attr.name}" özelliğini silmek istediğinizden emin misiniz?`)) return
    const r = await fetch(`/api/admin/attributes/${attr.id}`, { method: "DELETE" })
    if (!r.ok) {
      const d = await r.json()
      showToast(d.message || "Silinemedi.", false)
    } else {
      showToast("Özellik silindi.", true)
      load()
    }
  }

  // Değer ekle
  const saveValue = async (attrId: number) => {
    const nv = newValueMap[attrId]
    if (!nv?.value.trim()) return
    setSavingValue(attrId)
    try {
      const r = await fetch(`/api/admin/attributes/${attrId}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: nv.value.trim(),
          slug: nv.slug || toSlug(nv.value),
          colorHex: nv.colorHex || null,
        }),
      })
      if (!r.ok) {
        const d = await r.json()
        showToast(d.message || "Hata oluştu.", false)
        return
      }
      showToast("Değer eklendi.", true)
      setNewValueMap((prev) => ({ ...prev, [attrId]: { value: "", slug: "", colorHex: "" } }))
      load()
    } finally {
      setSavingValue(null)
    }
  }

  // Değer sil
  const deleteValue = async (attrId: number, valueId: number, valueName: string) => {
    if (!confirm(`"${valueName}" değerini silmek istediğinizden emin misiniz?`)) return
    const r = await fetch(`/api/admin/attributes/${attrId}/values/${valueId}`, {
      method: "DELETE",
    })
    if (!r.ok) {
      const d = await r.json()
      showToast(d.message || "Silinemedi.", false)
    } else {
      showToast("Değer silindi.", true)
      load()
    }
  }

  // İsim düzenleme
  const saveEditName = async (attr: Attribute) => {
    if (!editName.trim()) return
    await fetch(`/api/admin/attributes/${attr.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    })
    setEditId(null)
    load()
  }

  return (
    <div className="mx-auto max-w-4xl pb-24 px-4 sm:px-6">
      {toast && (
        <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />
      )}

      {/* Başlık */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Ürün Özellikleri</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Renk, beden, materyal gibi özellik türlerini ve değerlerini yönetin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewAttr((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:opacity-90 transition"
        >
          <FaPlus className="h-3.5 w-3.5" />
          Yeni Özellik
        </button>
      </div>

      {/* Yeni özellik formu */}
      {showNewAttr && (
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-zinc-700">Yeni Özellik Ekle</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">Ad *</label>
              <input
                type="text"
                value={newAttr.name}
                onChange={(e) => setNewAttr((p) => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))}
                placeholder="Örn: Renk"
                className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">Slug</label>
              <input
                type="text"
                value={newAttr.slug}
                onChange={(e) => setNewAttr((p) => ({ ...p, slug: e.target.value }))}
                placeholder="renk"
                className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm font-mono outline-none focus:border-brand-teal"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">Tip</label>
              <select
                value={newAttr.type}
                onChange={(e) => setNewAttr((p) => ({ ...p, type: e.target.value as AttributeType }))}
                className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-brand-teal"
              >
                {(Object.keys(TYPE_LABELS) as AttributeType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAttr.isVariant}
                  onChange={(e) => setNewAttr((p) => ({ ...p, isVariant: e.target.checked }))}
                  className="h-4 w-4 accent-brand-teal"
                />
                Varyant oluşturur
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAttr.isFilterable}
                  onChange={(e) => setNewAttr((p) => ({ ...p, isFilterable: e.target.checked }))}
                  className="h-4 w-4 accent-brand-teal"
                />
                Filtrelenebilir
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={saveAttribute}
              disabled={savingAttr || !newAttr.name.trim()}
              className="flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {savingAttr ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewAttr(false)}
              className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-zinc-400 text-sm">
          Yükleniyor...
        </div>
      ) : attributes.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-400">
          <p className="text-sm font-medium">Henüz özellik eklenmedi.</p>
          <button
            type="button"
            onClick={() => setShowNewAttr(true)}
            className="text-xs text-brand-teal font-semibold hover:underline"
          >
            İlk özelliği ekle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {attributes.map((attr) => {
            const isExpanded = expanded === attr.id
            const nv = newValueMap[attr.id] ?? { value: "", slug: "", colorHex: "" }

            return (
              <div
                key={attr.id}
                className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Başlık satırı */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : attr.id)}
                    className="text-zinc-400 hover:text-zinc-600 transition"
                  >
                    {isExpanded ? (
                      <FaChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <FaChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {editId === attr.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditName(attr)
                          if (e.key === "Escape") setEditId(null)
                        }}
                        autoFocus
                        className="h-8 flex-1 rounded-lg border border-zinc-200 px-2 text-sm outline-none focus:border-brand-teal"
                      />
                      <button type="button" onClick={() => saveEditName(attr)} className="text-emerald-600 hover:text-emerald-700">
                        <FaCheck className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setEditId(null)} className="text-zinc-400">
                        <FaTimes className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center gap-3 min-w-0">
                      <span className="font-semibold text-zinc-800 text-sm truncate">{attr.name}</span>
                      <span className="text-xs font-mono text-zinc-400 hidden sm:inline">{attr.slug}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[attr.type]}`}>
                        {TYPE_LABELS[attr.type]}
                      </span>
                      {attr.isVariant && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Varyant
                        </span>
                      )}
                    </div>
                  )}

                  <span className="text-xs text-zinc-400 shrink-0">{attr.values.length} değer</span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setEditId(attr.id); setEditName(attr.name) }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                      title="Düzenle"
                    >
                      <FaPencilAlt className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(attr)}
                      className={`flex h-8 items-center rounded-lg px-2 text-[11px] font-bold transition ${
                        attr.isActive
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {attr.isActive ? "Aktif" : "Pasif"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAttribute(attr)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 hover:bg-red-50 hover:text-red-500 transition"
                      title="Sil"
                    >
                      <FaTrash className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Genişletilmiş değerler paneli */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 px-5 pb-5 pt-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {attr.values.map((val) => (
                        <div
                          key={val.id}
                          className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm"
                        >
                          {attr.type === "COLOR" && val.colorHex && (
                            <span
                              className="h-3 w-3 rounded-full border border-zinc-300 shrink-0"
                              style={{ background: val.colorHex }}
                            />
                          )}
                          <span className="text-zinc-700">{val.value}</span>
                          <button
                            type="button"
                            onClick={() => deleteValue(attr.id, val.id, val.value)}
                            className="text-zinc-300 opacity-0 group-hover:opacity-100 transition hover:text-red-500"
                          >
                            <FaTimes className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Yeni değer ekleme */}
                    <div className="flex flex-wrap items-end gap-2 mt-3 pt-3 border-t border-zinc-100">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-zinc-400">Değer *</label>
                        <input
                          type="text"
                          value={nv.value}
                          onChange={(e) =>
                            setNewValueMap((prev) => ({
                              ...prev,
                              [attr.id]: { ...nv, value: e.target.value, slug: nv.slug || toSlug(e.target.value) },
                            }))
                          }
                          onKeyDown={(e) => e.key === "Enter" && saveValue(attr.id)}
                          placeholder="Örn: Gold"
                          className="h-9 w-36 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-brand-teal"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-zinc-400">Slug</label>
                        <input
                          type="text"
                          value={nv.slug}
                          onChange={(e) =>
                            setNewValueMap((prev) => ({ ...prev, [attr.id]: { ...nv, slug: e.target.value } }))
                          }
                          placeholder="gold"
                          className="h-9 w-28 rounded-lg border border-zinc-200 px-3 text-sm font-mono outline-none focus:border-brand-teal"
                        />
                      </div>
                      {attr.type === "COLOR" && (
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-zinc-400">Renk Hex</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={nv.colorHex || "#000000"}
                              onChange={(e) =>
                                setNewValueMap((prev) => ({ ...prev, [attr.id]: { ...nv, colorHex: e.target.value } }))
                              }
                              className="h-9 w-10 cursor-pointer rounded border border-zinc-200 p-0.5"
                            />
                            <input
                              type="text"
                              value={nv.colorHex}
                              onChange={(e) =>
                                setNewValueMap((prev) => ({ ...prev, [attr.id]: { ...nv, colorHex: e.target.value } }))
                              }
                              placeholder="#D4AF37"
                              className="h-9 w-24 rounded-lg border border-zinc-200 px-2 text-sm font-mono outline-none focus:border-brand-teal"
                            />
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => saveValue(attr.id)}
                        disabled={savingValue === attr.id || !nv.value.trim()}
                        className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-teal px-4 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition"
                      >
                        <FaPlus className="h-2.5 w-2.5" />
                        Ekle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
