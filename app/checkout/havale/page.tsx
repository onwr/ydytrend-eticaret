"use client"

import { Suspense, use, useEffect, useState } from "react"
import Link from "next/link"
import { HomeHeader } from "@/components/home/HomeHeader"
import { HomeFooter } from "@/components/home/HomeFooter"
import { BankTransferInfo } from "@/components/checkout/BankTransferInfo"
import { ReceiptUploadForm } from "@/components/checkout/ReceiptUploadForm"
import { formatCurrency } from "@/lib/cart"
import type { PublicOrder } from "@/types/order"

function HavaleContent({ orderNo }: { orderNo: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [receiptJustUploaded, setReceiptJustUploaded] = useState(false)

  const load = () => {
    fetch(`/api/orders/${encodeURIComponent(orderNo)}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setOrder(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [orderNo])

  if (!orderNo) {
    return (
      <div className="py-20 text-center">
        <p className="text-brand-muted">Geçersiz sipariş.</p>
        <Link href="/" className="mt-4 inline-block text-brand-teal hover:underline">
          Ana sayfaya dön
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-border border-t-brand-teal" />
      </div>
    )
  }

  if (!order || order.message) {
    return (
      <div className="py-20 text-center">
        <p className="text-brand-muted">Sipariş bulunamadı veya erişim yetkiniz yok.</p>
        <Link href="/login" className="mt-4 inline-block text-brand-teal hover:underline">
          Giriş yapın
        </Link>
      </div>
    )
  }

  const receiptUrl = order.payments?.[0]?.receiptUrl
  const grandTotal = Number(order.grandTotal ?? 0)
  const hasReceipt = Boolean(receiptUrl) || receiptJustUploaded

  const handleReceiptUploaded = () => {
    setReceiptJustUploaded(true)
    load()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-black text-brand-navy">Ödeme Talimatları</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Sipariş <span className="font-bold text-brand-navy">#{orderNo}</span> oluşturuldu.
        </p>
        {!hasReceipt && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
            Havale/EFT ödemenizi yaptıktan sonra dekontunuzu yükleyin. Dekont yüklenmeden sayfadan devam edemezsiniz.
          </p>
        )}
      </div>

      <BankTransferInfo orderNo={orderNo} amountLabel={formatCurrency(grandTotal)} />

      <ReceiptUploadForm
        orderNo={orderNo}
        existingReceiptUrl={receiptUrl}
        onUploaded={handleReceiptUploaded}
        required
      />

      <div className="space-y-3">
        {!hasReceipt && (
          <p className="text-center text-xs text-brand-muted">
            Sipariş detayı ve alışverişe devam butonları dekont yüklendikten sonra aktif olur.
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {hasReceipt ? (
            <Link
              href={`/profil/siparislerim/${encodeURIComponent(orderNo)}`}
              className="rounded-lg border border-brand-border bg-white px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-brand-navy hover:border-brand-teal"
            >
              Sipariş detayı
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="cursor-not-allowed rounded-lg border border-brand-border bg-brand-page px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-brand-muted opacity-60"
              title="Önce dekont yükleyin"
            >
              Sipariş detayı
            </span>
          )}
          {hasReceipt ? (
            <Link
              href="/"
              className="rounded-lg bg-brand-navy px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-white hover:bg-brand-teal"
            >
              Alışverişe devam
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="cursor-not-allowed rounded-lg bg-brand-navy/40 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-white opacity-60"
              title="Önce dekont yükleyin"
            >
              Alışverişe devam
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HavalePage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string }>
}) {
  const params = use(searchParams)
  const orderNo = params.orderNo?.trim() ?? ""

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      <HomeHeader />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-border border-t-brand-teal" />
            </div>
          }
        >
          <HavaleContent orderNo={orderNo} />
        </Suspense>
      </main>
      <HomeFooter />
    </div>
  )
}
