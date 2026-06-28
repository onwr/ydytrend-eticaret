"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { dispatchCartUpdated } from "@/lib/cartEvents"

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/"
  }
  return raw
}

const inputClassName =
  "h-11 w-full rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered") === "1"
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      })
      const json = (await res.json()) as { message?: string }
      if (!res.ok) {
        throw new Error(json.message ?? "Giriş başarısız.")
      }
      dispatchCartUpdated()
      router.replace(callbackUrl)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-sm md:p-8"
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-navy">Üye Girişi</h1>
        <p className="text-sm text-brand-muted">Hesabına erişmek için bilgilerini gir.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {registered ? (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-brand-success">
            Kayıt tamamlandı. Giriş yapabilirsiniz.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-brand-danger">{error}</div>
        ) : null}

        <Input
          label="E-posta"
          type="email"
          value={email}
          onChange={(v) => setEmail(v)}
          required
          autoComplete="email"
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-brand-muted">Şifre</label>
            <Link
              href="/forgot-password"
              title="Şifremi Unuttum"
              className="text-[11px] font-medium text-brand-teal hover:text-brand-navy hover:underline"
            >
              Şifremi Unuttum
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={inputClassName}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-lg bg-brand-teal text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-40"
        >
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>

        <p className="pt-2 text-center text-xs text-brand-muted">
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-bold text-brand-teal hover:text-brand-navy hover:underline">
            Hemen Üye Ol
          </Link>
        </p>
      </form>
    </motion.div>
  )
}

interface InputProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
}

function Input({ label, value, onChange, type = "text", required, autoComplete }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-brand-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className={inputClassName}
      />
    </div>
  )
}
