"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Barcode from "react-barcode"
import type { AdminBarcodeProduct } from "@/types/admin"

type BarcodePrintItem = {
  id: string
  name: string
  sku?: string | null
  barcode?: string | null
  price: number
}

function PrintBarcodesContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<BarcodePrintItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = searchParams.get("ids")
    const variantIds = searchParams.get("variantIds")
    if (!ids && !variantIds) {
      void Promise.resolve().then(() => setLoading(false))
      return
    }

    let cancelled = false
    const query = ids ? `ids=${ids}` : `variantIds=${variantIds}`
    fetch(`/api/admin/products/barcodes?${query}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const flatItems: BarcodePrintItem[] = []
        ;(data.items || []).forEach((p: AdminBarcodeProduct) => {
          if (p.variants && p.variants.length > 0) {
            p.variants.forEach((v) => {
              flatItems.push({
                id: `v-${v.id}`,
                name: `${p.name} - ${v.name}`,
                sku: v.sku,
                barcode: p.barcode,
                price: Number(v.price || p.basePrice || 0),
              })
            })
          } else {
            flatItems.push({
              id: `p-${p.id}`,
              name: p.name,
              sku: p.sku,
              barcode: p.barcode,
              price: Number(p.basePrice || 0),
            })
          }
        })

        const valid = flatItems.filter((item) => item.sku || item.barcode)
        setProducts(valid)
        setLoading(false)
        setTimeout(() => window.print(), 1000)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [searchParams])

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-zinc-400 text-sm">
      Barkodlar hazırlanıyor...
    </div>
  )

  if (products.length === 0) return (
    <div className="flex h-screen items-center justify-center text-zinc-400 text-sm">
      Yazdırılacak ürün bulunamadı.
    </div>
  )

  const sanitizeBarcode = (val: string) => {
    return val
      .replace(/ğ/g, "g")
      .replace(/Ğ/g, "G")
      .replace(/ü/g, "u")
      .replace(/Ü/g, "U")
      .replace(/ş/g, "s")
      .replace(/Ş/g, "S")
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .replace(/ö/g, "o")
      .replace(/Ö/g, "O")
      .replace(/ç/g, "c")
      .replace(/Ç/g, "C")
      .replace(/[^\x00-\x7F]/g, "")
  }

  return (
    <div className="barcode-grid grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 print:p-0 print:grid-cols-4 print:gap-0">
      {products.map((product) => {
        const rawValue = product.sku || product.barcode
        const barcodeValue = sanitizeBarcode(rawValue || "")
        return (
          <div
            key={product.id}
            className="flex flex-col items-center justify-center p-2 border border-zinc-200 text-center bg-white print:border-zinc-300 print:h-[35mm] print:w-full overflow-hidden break-inside-avoid page-break-inside-avoid"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <p className="text-[9px] font-bold leading-tight mb-1 line-clamp-1 w-full text-zinc-800">
              {product.name}
            </p>

            <div className="flex items-center justify-center w-full scale-90 sm:scale-100">
              <Barcode
                value={barcodeValue}
                format="CODE128"
                width={1.0}
                height={35}
                fontSize={10}
                margin={0}
                displayValue={true}
              />
            </div>

            <p className="text-[10px] font-bold text-zinc-900 mt-1">
              ₺{Number(product.price).toLocaleString("tr-TR")}
            </p>
          </div>
        )
      })}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { margin: 10mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          header, footer, nav, aside, .no-print { display: none !important; }
          .grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; }
          div { break-inside: avoid !important; }
        }
        svg { max-width: 100%; height: auto !important; }
      `}} />
    </div>
  )
}

export default function PrintBarcodesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-400 text-sm">Yükleniyor...</div>}>
      <PrintBarcodesContent />
    </Suspense>
  )
}
