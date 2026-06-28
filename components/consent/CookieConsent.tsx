"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  defaultConsent,
  parseConsent,
  type CookieConsent,
} from "@/lib/analytics/consent"

type Props = {
  onChange: (consent: CookieConsent) => void
}

export function CookieConsentBanner({ onChange }: Props) {
  const [visible, setVisible] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [draft, setDraft] = useState<CookieConsent>(defaultConsent())

  useEffect(() => {
    const existing = parseConsent(localStorage.getItem(CONSENT_STORAGE_KEY))
    if (existing) {
      onChange(existing)
      return
    }
    const t = window.setTimeout(() => setVisible(true), 0)

    const openPrefs = () => {
      setDraft(parseConsent(localStorage.getItem(CONSENT_STORAGE_KEY)) ?? defaultConsent())
      setVisible(true)
      setManageOpen(true)
    }
    window.addEventListener("ydy:open-cookie-preferences", openPrefs)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener("ydy:open-cookie-preferences", openPrefs)
    }
  }, [onChange])

  const persist = (consent: CookieConsent) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent))
    onChange(consent)
    setVisible(false)
    setManageOpen(false)
  }

  const acceptAll = () => {
    persist({
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      necessary: true,
      analytics: true,
      marketing: true,
    })
  }

  const rejectOptional = () => {
    persist(defaultConsent())
  }

  if (!visible && !manageOpen) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5"
      role="dialog"
      aria-label="Çerez tercihleri"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {!manageOpen ? (
          <>
            <p className="text-sm text-zinc-600">
              Deneyiminizi iyileştirmek için zorunlu çerezler her zaman kullanılır. Analitik ve
              pazarlama çerezleri yalnızca izninizle etkinleştirilir.{" "}
              <Link href="/sayfa/gizlilik-ve-guvenlik" className="underline">
                Gizlilik politikası
              </Link>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-full bg-brand-gold px-4 py-2 text-sm font-medium text-white"
              >
                Kabul Et
              </button>
              <button
                type="button"
                onClick={rejectOptional}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700"
              >
                Reddet
              </button>
              <button
                type="button"
                onClick={() => setManageOpen(true)}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700"
              >
                Tercihleri Yönet
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-zinc-800">Çerez tercihleri</h2>
            <label className="flex items-center justify-between gap-4 text-sm text-zinc-600">
              <span>Zorunlu (her zaman açık)</span>
              <input type="checkbox" checked disabled readOnly />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-zinc-600">
              <span>Analitik</span>
              <input
                type="checkbox"
                checked={draft.analytics}
                onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm text-zinc-600">
              <span>Pazarlama</span>
              <input
                type="checkbox"
                checked={draft.marketing}
                onChange={(e) => setDraft((d) => ({ ...d, marketing: e.target.checked }))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  persist({ ...draft, timestamp: new Date().toISOString(), necessary: true })
                }
                className="rounded-full bg-brand-gold px-4 py-2 text-sm font-medium text-white"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-700"
              >
                Geri
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Footer veya başka yerden tercih panelini açmak için. */
export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent("ydy:open-cookie-preferences"))
}

export function CookiePreferencesListener({ onChange }: Props) {
  useEffect(() => {
    const handler = () => {
      const existing = parseConsent(localStorage.getItem(CONSENT_STORAGE_KEY)) ?? defaultConsent()
      onChange(existing)
      window.dispatchEvent(new CustomEvent("ydy:cookie-manage-open"))
    }
    window.addEventListener("ydy:open-cookie-preferences", handler)
    return () => window.removeEventListener("ydy:open-cookie-preferences", handler)
  }, [onChange])
  return null
}
