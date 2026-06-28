"use client"

import Link from "next/link"
import { BRAND_SUPPORT_EMAIL } from "@/lib/brand"

type Props = {
  title?: string
  message?: string
  reset?: () => void
  requestId?: string | null
}

export function ErrorFallback({
  title = "Bir şeyler ters gitti",
  message = "İşleminiz tamamlanamadı. Lütfen tekrar deneyin veya ana sayfaya dönün.",
  reset,
  requestId,
}: Props) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-zinc-800">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-500">{message}</p>
      {requestId && (
        <p className="mt-4 text-xs text-zinc-400">
          Referans: <span className="font-mono">{requestId}</span>
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {reset && (
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-brand-gold px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7]"
          >
            Tekrar dene
          </button>
        )}
        <Link
          href="/"
          className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Ana sayfaya dön
        </Link>
        <a
          href={`mailto:${BRAND_SUPPORT_EMAIL}`}
          className="text-sm text-brand-gold underline hover:text-[#0284C7]"
        >
          Destek
        </a>
      </div>
    </div>
  )
}
