"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { dispatchCartUpdated } from "@/lib/cartEvents"
import { sanitizePostAuthPath } from "@/lib/safeCallbackUrl"

const steps = [
  { title: "Hesap Bilgileri" },
  { title: "İletişim" },
  { title: "Adres" },
]

interface City {
  id: number
  name: string
}

interface District {
  id: number
  name: string
}

type RegisterFormProps = {
  /** Kayıt sonrası güvenli site-içi path (örn. `/cart`). */
  postAuthRedirect?: string
}

const inputClassName =
  "h-11 w-full rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"

export default function RegisterForm({ postAuthRedirect = "/cart" }: RegisterFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    district: "",
    neighborhood: "",
    doorNo: "",
  })

  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])

  useEffect(() => {
    let cancelled = false
    fetch("/api/locations/provinces")
      .then((r) => r.json())
      .then((d: { items?: City[] }) => {
        if (!cancelled && Array.isArray(d.items)) setCities(d.items)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const selected = cities.find((c) => c.name === form.city)
    if (!selected) {
      let cancelled = false
      void Promise.resolve().then(() => {
        if (!cancelled) setDistricts([])
      })
      return () => {
        cancelled = true
      }
    }

    let cancelled = false
    fetch(`/api/locations/provinces/${selected.id}/districts`)
      .then((r) => r.json())
      .then((d: { items?: District[] }) => {
        if (!cancelled && Array.isArray(d.items)) setDistricts(d.items)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [form.city, cities])

  const update = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }))

  const formatPhone = (val: string) => {
    const numbers = val.replace(/\D/g, "").slice(0, 10)
    let formatted = ""
    if (numbers.length > 0) formatted += numbers.slice(0, 3)
    if (numbers.length > 3) formatted += " " + numbers.slice(3, 6)
    if (numbers.length > 6) formatted += " " + numbers.slice(6, 8)
    if (numbers.length > 8) formatted += " " + numbers.slice(8, 10)
    return formatted
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          password: form.password,
          phone: form.phone.replace(/\s/g, ""),
          city: form.city,
          district: form.district,
          neighborhood: form.neighborhood,
          doorNo: form.doorNo,
        }),
      })
      const json = (await res.json()) as { message?: string }
      if (!res.ok) {
        throw new Error(json.message ?? "Kayıt başarısız.")
      }
      dispatchCartUpdated()
      router.replace(sanitizePostAuthPath(postAuthRedirect))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      void handleSubmit()
    }
  }

  const back = () => {
    if (step > 0) setStep(step - 1)
  }

  const isStepValid = () => {
    if (step === 0) return form.firstName && form.lastName && form.email && form.password
    if (step === 1) return form.phone.replace(/\s/g, "").length === 10
    if (step === 2) return form.city && form.district && form.neighborhood && form.doorNo
    return false
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm md:p-8">
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-brand-danger">{error}</div>
      )}

      <div className="mb-2">
        <div className="mb-2 flex justify-between text-xs text-brand-muted">
          <span>Adım {step + 1}</span>
          <span>{steps.length}</span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-border">
          <div
            className="h-full rounded-full bg-brand-teal transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <h1 className="mt-3 text-lg font-bold text-brand-navy">{steps[step].title}</h1>
      </div>

      <div className="relative h-[360px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute w-full space-y-3"
          >
            {step === 0 && (
              <>
                <Input label="Ad" value={form.firstName} onChange={(v: string) => update("firstName", v)} />
                <Input label="Soyad" value={form.lastName} onChange={(v: string) => update("lastName", v)} />
                <Input label="E-posta" value={form.email} onChange={(v: string) => update("email", v)} />
                <Input
                  label="Şifre"
                  type="password"
                  value={form.password}
                  onChange={(v: string) => update("password", v)}
                />
              </>
            )}

            {step === 1 && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-brand-muted">Telefon</label>
                <div className="flex h-11 items-center rounded-lg border border-brand-border bg-white px-3 focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/20">
                  <span className="mr-2 text-sm text-brand-muted">+90</span>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", formatPhone(e.target.value))}
                    className="w-full text-sm text-brand-text outline-none"
                    placeholder="5XX XXX XX XX"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-brand-muted">İl</label>
                    <select
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      className={`${inputClassName} appearance-none`}
                    >
                      <option value="">Seçiniz</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-brand-muted">İlçe</label>
                    <select
                      value={form.district}
                      onChange={(e) => update("district", e.target.value)}
                      className={`${inputClassName} appearance-none`}
                    >
                      <option value="">Seçiniz</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Mahalle - Sokak - Cadde"
                  value={form.neighborhood}
                  onChange={(v: string) => update("neighborhood", v)}
                />
                <Input label="Apartman - Kapı No" value={form.doorNo} onChange={(v: string) => update("doorNo", v)} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || loading}
          className="text-sm text-brand-muted transition hover:text-brand-navy disabled:opacity-30"
        >
          Geri
        </button>

        <button
          type="button"
          onClick={next}
          disabled={!isStepValid() || loading}
          className="h-10 rounded-lg bg-brand-teal px-5 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-40"
        >
          {loading ? "..." : step === steps.length - 1 ? "Tamamla" : "Devam"}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-brand-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/login" className="font-bold text-brand-teal hover:text-brand-navy hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  )
}

interface InputProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}

function Input({ label, value, onChange, type = "text" }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-brand-muted">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputClassName} />
    </div>
  )
}
