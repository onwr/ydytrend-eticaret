"use client"

import { useRef, useState } from "react"
import { FaCheckCircle, FaCloudUploadAlt, FaFilePdf } from "react-icons/fa"
import { RECEIPT_MAX_BYTES, isAllowedReceiptMime } from "@/lib/receiptUpload"

export function ReceiptUploadForm({
  orderNo,
  existingReceiptUrl,
  onUploaded,
  required = false,
}: {
  orderNo: string
  existingReceiptUrl?: string | null
  onUploaded?: () => void
  /** Sayfadan çıkmadan önce dekont zorunluysa true */
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mime, setMime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(Boolean(existingReceiptUrl))

  const onPick = (file: File | null) => {
    setError(null)
    setSuccess(false)
    if (!file) return

    if (!isAllowedReceiptMime(file.type)) {
      setError("Yalnızca JPG, PNG, WEBP veya PDF yükleyebilirsiniz.")
      return
    }
    if (file.size > RECEIPT_MAX_BYTES) {
      setError("Dosya en fazla 5 MB olabilir.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? "")
      setPreview(result)
      setMime(file.type)
      setFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!preview || !mime) {
      setError("Lütfen dekont dosyası seçin.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNo)}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ receiptData: preview, fileName: fileName ?? "dekont" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Yükleme başarısız.")
      setSuccess(true)
      onUploaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız.")
    } finally {
      setLoading(false)
    }
  }

  if (success || existingReceiptUrl) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <FaCheckCircle className="mx-auto mb-3 h-10 w-10 text-brand-success" />
        <p className="text-sm font-bold text-emerald-800">Dekontunuz alındı</p>
        <p className="mt-2 text-xs text-emerald-700">
          {required
            ? "Ödemeniz kontrol edildikten sonra siparişiniz hazırlanacaktır. Artık sipariş detayına gidebilir veya alışverişe devam edebilirsiniz."
            : "Ödemeniz kontrol edildikten sonra siparişiniz hazırlanacaktır."}
        </p>
        {existingReceiptUrl && (
          <a
            href={existingReceiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-xs font-bold text-brand-teal hover:underline"
          >
            Yüklenen dekontu görüntüle
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-navy">Dekont Yükle</h3>
          <p className="mt-1 text-xs text-brand-muted">
            {required
              ? "Ödemenizi yaptıktan sonra dekontunuzu yükleyin. Yüklemeden sipariş detayına veya alışverişe devam edemezsiniz."
              : "Ödeme yaptıktan sonra dekont görselinizi veya PDF dosyanızı yükleyin."}
          </p>
        </div>
        {required && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            Zorunlu
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-border bg-brand-page px-4 py-8 transition hover:border-brand-teal"
      >
        {mime === "application/pdf" ? (
          <FaFilePdf className="h-10 w-10 text-brand-teal" />
        ) : preview && mime?.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Önizleme" className="max-h-32 rounded-lg object-contain" />
        ) : (
          <FaCloudUploadAlt className="h-10 w-10 text-brand-muted" />
        )}
        <span className="text-xs font-bold text-brand-navy">
          {fileName ? fileName : "Dosya seçin veya sürükleyin"}
        </span>
        <span className="text-[10px] text-brand-muted">JPG, PNG, WEBP, PDF — max 5 MB</span>
      </button>

      {error && <p className="mt-3 text-xs font-medium text-brand-danger">{error}</p>}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={loading || !preview}
        className="mt-4 h-11 w-full rounded-lg bg-brand-teal text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-40"
      >
        {loading ? "Yükleniyor..." : "Dekontu Gönder"}
      </button>
    </div>
  )
}
