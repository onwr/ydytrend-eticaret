"use client"

import { useState } from "react"

export function HomeNewsletter() {
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    if (!consent) {
      setMessage({ text: "Devam etmek için onay kutusunu işaretleyin.", ok: false })
      return
    }

    setLoading(true)
    try {
      const form = e.currentTarget
      const website = (form.elements.namedItem("website") as HTMLInputElement)?.value ?? ""

      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true, website }),
      })
      const json = (await res.json()) as { message?: string }
      setMessage({
        text: json.message ?? (res.ok ? "Kayıt alındı." : "Kayıt tamamlanamadı."),
        ok: res.ok,
      })
      if (res.ok) {
        setEmail("")
        setConsent(false)
      }
    } catch {
      setMessage({ text: "Bağlantı hatası. Lütfen tekrar deneyin.", ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-6 md:py-8">
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-navy px-6 py-10 text-center text-white md:px-12 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-soft">
          Bülten
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
          Yeni Sezon Fırsatlarını Kaçırma
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-white/75">
          Takı, çanta ve aksesuar koleksiyonlarındaki yeniliklerden ve özel indirimlerden ilk sen haberdar ol.
        </p>
        <form
          className="mx-auto mt-8 max-w-md space-y-3"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              E-posta adresi
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              disabled={loading}
              className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 shrink-0 rounded-xl bg-brand-gold px-6 text-sm font-semibold text-brand-navy transition hover:bg-brand-gold/90 disabled:opacity-60"
            >
              {loading ? "Kaydediliyor..." : "Abone Ol"}
            </button>
          </div>
          <label className="flex items-start gap-2 text-left text-[11px] text-white/60">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={loading}
              className="mt-0.5 rounded border-white/20"
            />
            <span>
              Kampanya ve yenilik e-postaları almak istiyorum. İstediğim zaman abonelikten çıkabilirim.
            </span>
          </label>
        </form>
        {message ? (
          <p
            className={`mt-4 text-sm ${message.ok ? "text-brand-gold-soft" : "text-rose-300"}`}
            role="status"
          >
            {message.text}
          </p>
        ) : (
          <p className="mt-4 text-[11px] text-white/50">
            E-posta adresiniz yalnızca bülten amaçlı kullanılır; üçüncü taraflarla paylaşılmaz.
          </p>
        )}
      </div>
    </section>
  )
}
