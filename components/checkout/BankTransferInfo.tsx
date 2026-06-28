"use client"

import { useEffect, useState } from "react"
import { FaCopy, FaUniversity } from "react-icons/fa"

type BankInfo = {
  accountHolder: string
  bankName: string
  ibanFormatted: string
  transferNote: string
  isConfigured: boolean
}

export function BankTransferInfo({
  orderNo,
  amountLabel,
}: {
  orderNo?: string
  amountLabel?: string
}) {
  const [bank, setBank] = useState<BankInfo | null>(null)
  const [copied, setCopied] = useState<"iban" | "desc" | null>(null)

  useEffect(() => {
    fetch("/api/payment/bank-transfer")
      .then((r) => r.json())
      .then((d) => setBank(d))
      .catch(() => {})
  }, [])

  const copy = async (text: string, key: "iban" | "desc") => {
    try {
      await navigator.clipboard.writeText(text.replace(/\s/g, ""))
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* ignore */
    }
  }

  if (!bank) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-border border-t-brand-teal" />
      </div>
    )
  }

  if (!bank.isConfigured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Banka hesap bilgileri henüz tanımlanmamış. Lütfen müşteri hizmetleri ile iletişime geçin.
      </div>
    )
  }

  const description = orderNo ?? "Sipariş numaranız"

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6 text-left shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue-light text-brand-teal">
          <FaUniversity className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-brand-navy">Havale / EFT ile Ödeme</h3>
          <p className="text-xs text-brand-muted">Aşağıdaki hesaba transfer yapın</p>
        </div>
      </div>

      {amountLabel && (
        <div className="mb-4 rounded-xl bg-brand-page px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Ödenecek tutar</p>
          <p className="text-xl font-black text-brand-navy">{amountLabel}</p>
        </div>
      )}

      <dl className="space-y-3 text-sm">
        {bank.bankName && (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Banka</dt>
            <dd className="font-semibold text-brand-text">{bank.bankName}</dd>
          </div>
        )}
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Hesap sahibi</dt>
          <dd className="font-semibold text-brand-text">{bank.accountHolder}</dd>
        </div>
        <div>
          <dt className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">IBAN</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-bold tracking-wide text-brand-navy">{bank.ibanFormatted}</span>
            <button
              type="button"
              onClick={() => void copy(bank.ibanFormatted, "iban")}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2 py-1 text-[10px] font-bold uppercase text-brand-teal hover:bg-brand-page"
            >
              <FaCopy className="h-3 w-3" />
              {copied === "iban" ? "Kopyalandı" : "Kopyala"}
            </button>
          </dd>
        </div>
        {orderNo && (
          <div>
            <dt className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">Açıklama (zorunlu)</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-brand-navy">{description}</span>
              <button
                type="button"
                onClick={() => void copy(description, "desc")}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2 py-1 text-[10px] font-bold uppercase text-brand-teal hover:bg-brand-page"
              >
                <FaCopy className="h-3 w-3" />
                {copied === "desc" ? "Kopyalandı" : "Kopyala"}
              </button>
            </dd>
          </div>
        )}
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-brand-muted">{bank.transferNote}</p>
    </div>
  )
}
