"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { FaSearch } from "react-icons/fa"
import type { DeviceFinderData } from "@/lib/homepageCategories"

export function DevicePartFinder({ data }: { data: DeviceFinderData }) {
  const router = useRouter()
  const [brandSlug, setBrandSlug] = useState("")
  const [modelSlug, setModelSlug] = useState("")
  const [partSlug, setPartSlug] = useState("")

  const selectedBrand = useMemo(
    () => data.brands.find((b) => b.slug === brandSlug),
    [data.brands, brandSlug]
  )

  const models = selectedBrand?.models ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const brand = selectedBrand
    const model = models.find((m) => m.slug === modelSlug)
    const part = data.partTypes.find((p) => p.slug === partSlug)

    if (brand && model && part) {
      router.push(
        `/search?q=${encodeURIComponent(`${brand.name} ${model.name} ${part.name}`)}`
      )
      return
    }

    if (brand && model) {
      router.push(`/categories/${brand.slug}/${model.slug}`)
      return
    }

    if (brand && part) {
      router.push(
        `/search?q=${encodeURIComponent(`${brand.name} ${part.name}`)}`
      )
      return
    }

    if (brand) {
      router.push(`/categories/${brand.slug}`)
      return
    }

    if (part) {
      router.push(`/categories/${part.slug}`)
      return
    }

    router.push("/search")
  }

  const hasBrands = data.brands.length > 0
  const hasPartTypes = data.partTypes.length > 0

  if (!hasBrands && !hasPartTypes) return null

  const selectClass =
    "h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-text outline-none transition-colors focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"

  return (
    <section className="py-8 md:py-10">
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-card shadow-[0_2px_16px_rgba(8,42,85,0.06)]">
        <div className="border-b border-brand-border bg-brand-blue-light/50 px-5 py-5 md:px-8">
          <h2 className="text-lg font-bold text-brand-text md:text-xl">
            Cihazına Uygun Parçayı Kolayca Bul
          </h2>
          <p className="mt-1 text-sm text-brand-muted">
            Kategori ağacından marka, model ve parça türünü seçerek uyumlu ürünlere ulaşın.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 p-5 md:grid-cols-4 md:items-end md:gap-5 md:p-8"
        >
          {hasBrands && (
            <div>
              <label htmlFor="device-brand" className="mb-1.5 block text-xs font-semibold text-brand-text">
                Marka Seç
              </label>
              <select
                id="device-brand"
                value={brandSlug}
                onChange={(e) => {
                  setBrandSlug(e.target.value)
                  setModelSlug("")
                }}
                className={selectClass}
              >
                <option value="">Marka seçin</option>
                {data.brands.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasBrands && (
            <div>
              <label htmlFor="device-model" className="mb-1.5 block text-xs font-semibold text-brand-text">
                Model Seç
              </label>
              <select
                id="device-model"
                value={modelSlug}
                onChange={(e) => setModelSlug(e.target.value)}
                disabled={!brandSlug || models.length === 0}
                className={`${selectClass} disabled:cursor-not-allowed disabled:bg-brand-page disabled:text-brand-muted`}
              >
                <option value="">
                  {models.length === 0 && brandSlug ? "Model bulunamadı" : "Model seçin"}
                </option>
                {models.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasPartTypes && (
            <div>
              <label htmlFor="device-part" className="mb-1.5 block text-xs font-semibold text-brand-text">
                Parça Türü Seç
              </label>
              <select
                id="device-part"
                value={partSlug}
                onChange={(e) => setPartSlug(e.target.value)}
                className={selectClass}
              >
                <option value="">Parça türü seçin</option>
                {data.partTypes.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          >
            <FaSearch className="h-3.5 w-3.5" aria-hidden />
            Ürünleri Göster
          </button>
        </form>
      </div>
    </section>
  )
}
