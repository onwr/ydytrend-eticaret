import type { ReturnRequestStatus, ReturnRequestType } from "@/generated/prisma/client"
import { escapeHtml, transactionalEmailHtml } from "@/lib/emails/emailLayout"

export type AfterSalesEmailEvent =
  | "order_cancelled"
  | "cancel_manual_refund_pending"
  | "return_received"
  | "return_under_review"
  | "return_approved"
  | "return_rejected"
  | "return_product_received"
  | "return_completed"
  | "exchange_received"
  | "exchange_approved"
  | "exchange_rejected"
  | "exchange_completed"
  | "order_shipped"
  | "order_delivered"

type ItemLine = { name: string; quantity: number; variantLabel?: string | null }

type AfterSalesEmailParams = {
  siteUrl: string
  storeName?: string
  event: AfterSalesEmailEvent
  orderNo: string
  requestNumber?: string | null
  items?: ItemLine[]
  customerNote?: string | null
  nextStep?: string | null
  trackingUrl?: string | null
  trackingNo?: string | null
}

const EVENT_META: Record<
  AfterSalesEmailEvent,
  { subject: string; title: string; lead: string; defaultNext: string }
> = {
  order_cancelled: {
    subject: "Siparişiniz iptal edildi",
    title: "Sipariş iptal edildi",
    lead: "Siparişiniz başarıyla iptal edildi.",
    defaultNext: "Ödemeniz havale/EFT ise iade süreci manuel olarak yürütülür; bilgilendirme ayrıca yapılır.",
  },
  cancel_manual_refund_pending: {
    subject: "İptal alındı — manuel iade bekleniyor",
    title: "İptal alındı",
    lead: "Sipariş iptaliniz alındı. Havale/EFT ödemesi için manuel iade işlemi başlatılacaktır.",
    defaultNext: "İade tutarı hesabınıza yansıtıldığında e-posta ile bilgilendirileceksiniz.",
  },
  return_received: {
    subject: "İade talebiniz alındı",
    title: "İade talebi alındı",
    lead: "İade talebiniz sistemimize ulaştı.",
    defaultNext: "Talebiniz kısa sürede incelenecek; sonuç e-posta ile bildirilecektir.",
  },
  return_under_review: {
    subject: "İade talebiniz inceleniyor",
    title: "İade incelemeye alındı",
    lead: "İade talebiniz ekibimiz tarafından inceleniyor.",
    defaultNext: "İnceleme tamamlandığında onay veya red bildirimi gönderilecektir.",
  },
  return_approved: {
    subject: "İade talebiniz onaylandı",
    title: "İade onaylandı",
    lead: "İade talebiniz onaylandı.",
    defaultNext: "Ürünü kargo ile göndermeniz bekleniyor. Kargo bilgilerinizi sipariş detayından takip edebilirsiniz.",
  },
  return_rejected: {
    subject: "İade talebiniz reddedildi",
    title: "İade reddedildi",
    lead: "İade talebiniz maalesef reddedildi.",
    defaultNext: "Detaylı bilgi için hesabınızdaki talep sayfasına göz atabilir veya destek ile iletişime geçebilirsiniz.",
  },
  return_product_received: {
    subject: "İade ürününüz teslim alındı",
    title: "İade ürünü teslim alındı",
    lead: "İade ettiğiniz ürün depomuza ulaştı.",
    defaultNext: "Kalite kontrolü sonrası iade işleminiz tamamlanacaktır.",
  },
  return_completed: {
    subject: "İade işleminiz tamamlandı",
    title: "İade tamamlandı",
    lead: "İade süreciniz tamamlandı.",
    defaultNext: "Ödeme iadesi banka/havale yöntemine göre 3–10 iş günü içinde yansıyabilir.",
  },
  exchange_received: {
    subject: "Değişim talebiniz alındı",
    title: "Değişim talebi alındı",
    lead: "Değişim talebiniz sistemimize ulaştı.",
    defaultNext: "Talebiniz incelendikten sonra onay bildirimi gönderilecektir.",
  },
  exchange_approved: {
    subject: "Değişim talebiniz onaylandı",
    title: "Değişim onaylandı",
    lead: "Değişim talebiniz onaylandı.",
    defaultNext: "Mevcut ürünü kargoya vermeniz bekleniyor; yeni ürün onay sonrası hazırlanacaktır.",
  },
  exchange_rejected: {
    subject: "Değişim talebiniz reddedildi",
    title: "Değişim reddedildi",
    lead: "Değişim talebiniz reddedildi.",
    defaultNext: "Detaylar için talep sayfanızı inceleyebilirsiniz.",
  },
  exchange_completed: {
    subject: "Değişim işleminiz tamamlandı",
    title: "Değişim tamamlandı",
    lead: "Değişim süreciniz tamamlandı.",
    defaultNext: "Yeni ürününüz kargoya verildiğinde ayrıca bilgilendirileceksiniz.",
  },
  order_shipped: {
    subject: "Siparişiniz kargoya verildi",
    title: "Sipariş kargoya verildi",
    lead: "Siparişiniz kargoya teslim edildi.",
    defaultNext: "Takip numaranız ile kargonuzu izleyebilirsiniz.",
  },
  order_delivered: {
    subject: "Siparişiniz teslim edildi",
    title: "Sipariş teslim edildi",
    lead: "Siparişiniz teslim edildi. Alışverişiniz için teşekkür ederiz!",
    defaultNext: "Memnun kalmadıysanız iade/değişim talebi oluşturabilirsiniz.",
  },
}

function itemsHtml(items: ItemLine[]): string {
  if (!items.length) return ""
  const rows = items
    .map(
      (it) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">${escapeHtml(it.name)}${it.variantLabel ? ` <span style="color:#94a3b8;">(${escapeHtml(it.variantLabel)})</span>` : ""}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">×${it.quantity}</td></tr>`
    )
    .join("")
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px 0;"><tbody>${rows}</tbody></table>`
}

export function afterSalesEmailContent(
  params: AfterSalesEmailParams
): { subject: string; text: string; html: string } {
  const store = params.storeName ?? "YDY Trend"
  const base = params.siteUrl.replace(/\/$/, "")
  const meta = EVENT_META[params.event]
  const orderLink = `${base}/siparislerim/${encodeURIComponent(params.orderNo)}`
  const returnLink = params.requestNumber
    ? `${base}/profil/iade-degisim/${encodeURIComponent(params.requestNumber)}`
    : `${base}/profil/iade-degisim`

  const subject = `${store} — ${meta.subject} (${params.orderNo})`
  const nextStep = params.nextStep?.trim() || meta.defaultNext

  const textLines = [
    "Merhaba,",
    "",
    meta.lead,
    "",
    `Sipariş: ${params.orderNo}`,
    params.requestNumber ? `RMA: ${params.requestNumber}` : "",
    params.trackingNo ? `Takip no: ${params.trackingNo}` : "",
    "",
    `Sonraki adım: ${nextStep}`,
    "",
    `Detay: ${params.requestNumber ? returnLink : orderLink}`,
    "",
    store,
  ].filter(Boolean)

  let inner = ""
  if (params.requestNumber) {
    inner += `<p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">RMA numarası: <strong style="color:#334155;">${escapeHtml(params.requestNumber)}</strong></p>`
  }
  inner += `<p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">Sipariş: <strong style="color:#334155;">${escapeHtml(params.orderNo)}</strong></p>`
  if (params.items?.length) {
    inner += itemsHtml(params.items)
  }
  if (params.customerNote?.trim()) {
    inner += `<p style="margin:0 0 12px 0;padding:12px;background:#fdf2f8;border-radius:8px;font-size:13px;color:#64748b;"><strong>Notunuz:</strong> ${escapeHtml(params.customerNote.trim())}</p>`
  }
  if (params.trackingUrl && params.trackingNo) {
    inner += `<p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">Takip: <a href="${escapeHtml(params.trackingUrl)}" style="color:#b8860b;">${escapeHtml(params.trackingNo)}</a></p>`
  }
  inner += `<p style="margin:0;font-size:14px;line-height:1.6;color:#475569;"><strong>Sonraki adım:</strong> ${escapeHtml(nextStep)}</p>`

  const ctaHref =
    params.event === "order_shipped" && params.trackingUrl
      ? params.trackingUrl
      : params.requestNumber
        ? returnLink
        : orderLink
  const ctaLabel =
    params.event === "order_shipped" && params.trackingUrl
      ? "Kargoyu takip et"
      : params.requestNumber
        ? "Talebi görüntüle"
        : "Siparişi görüntüle"

  const html = transactionalEmailHtml({
    siteUrl: params.siteUrl,
    storeName: store,
    preheader: `${meta.subject} — ${params.orderNo}`,
    title: meta.title,
    lead: meta.lead,
    innerHtml: inner,
    primaryCta: { href: ctaHref, label: ctaLabel },
  })

  return { subject, text: textLines.join("\n"), html }
}

export function returnStatusToEmailEvent(
  status: ReturnRequestStatus,
  type: ReturnRequestType
): AfterSalesEmailEvent | null {
  if (type === "EXCHANGE") {
    switch (status) {
      case "UNDER_REVIEW":
        return "return_under_review"
      case "WAITING_FOR_PRODUCT":
        return "exchange_approved"
      case "REJECTED":
        return "exchange_rejected"
      case "PRODUCT_RECEIVED":
        return "return_product_received"
      case "COMPLETED":
        return "exchange_completed"
      default:
        return null
    }
  }
  if (type === "RETURN") {
    switch (status) {
      case "UNDER_REVIEW":
        return "return_under_review"
      case "WAITING_FOR_PRODUCT":
        return "return_approved"
      case "REJECTED":
        return "return_rejected"
      case "PRODUCT_RECEIVED":
        return "return_product_received"
      case "COMPLETED":
        return "return_completed"
      default:
        return null
    }
  }
  return null
}

export async function sendAfterSalesEmailSafe(
  prisma: { $queryRaw?: unknown },
  send: () => Promise<void>
): Promise<void> {
  void prisma
  try {
    await send()
  } catch (e) {
    console.error("After-sales email error:", e)
  }
}
