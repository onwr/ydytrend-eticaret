import type { PaymentMethod } from "@/generated/prisma/client"
import { escapeHtml, transactionalEmailHtml } from "@/lib/emails/emailLayout"

function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "CARD":
      return "Kredi kartı"
    case "CASH_ON_DELIVERY":
      return "Kapıda ödeme"
    case "BANK_TRANSFER":
      return "Havale / EFT"
    default:
      return String(method)
  }
}

export function orderPlacedEmailContent(params: {
  siteUrl: string
  orderNo: string
  grandTotal: string
  paymentMethod: PaymentMethod
  storeName?: string
  bankTransfer?: {
    accountHolder: string
    bankName: string
    ibanFormatted: string
    transferNote: string
  }
}): { subject: string; text: string; html: string } {
  const base = params.siteUrl.replace(/\/$/, "")
  const store = params.storeName ?? "YDY Trend"
  const pm = paymentMethodLabel(params.paymentMethod)
  const ordersLink = `${base}/checkout/havale?orderNo=${encodeURIComponent(params.orderNo)}`
  const bank = params.bankTransfer

  const bankText = bank?.ibanFormatted
    ? [
        ``,
        `Banka bilgileri:`,
        bank.bankName ? `Banka: ${bank.bankName}` : "",
        `Hesap sahibi: ${bank.accountHolder}`,
        `IBAN: ${bank.ibanFormatted}`,
        `Açıklama: ${params.orderNo}`,
        bank.transferNote,
        ``,
        `Ödeme sonrası dekontunuzu yükleyin: ${ordersLink}`,
      ]
        .filter(Boolean)
        .join("\n")
    : ""

  const subject = `${store} — Siparişiniz alındı (${params.orderNo})`
  const text = [
    `Merhaba,`,
    ``,
    `Siparişiniz kaydedildi.`,
    ``,
    `Sipariş no: ${params.orderNo}`,
    `Toplam: ${params.grandTotal} TL`,
    `Ödeme: ${pm}`,
    bankText,
    `Sipariş detayı: ${ordersLink}`,
    ``,
    store,
  ].join("\n")

  const bankHtml = bank?.ibanFormatted
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0 0 0;background-color:#eff9fc;border:1px solid #bae6fd;border-radius:10px;overflow:hidden;">
  <tr>
    <td style="padding:16px 18px;">
      <p style="margin:0 0 10px 0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#0369a1;">Havale / EFT bilgileri</p>
      ${bank.bankName ? `<p style="margin:0 0 6px 0;font-size:14px;color:#334155;"><strong>Banka:</strong> ${escapeHtml(bank.bankName)}</p>` : ""}
      <p style="margin:0 0 6px 0;font-size:14px;color:#334155;"><strong>Hesap sahibi:</strong> ${escapeHtml(bank.accountHolder)}</p>
      <p style="margin:0 0 6px 0;font-size:14px;color:#334155;"><strong>IBAN:</strong> ${escapeHtml(bank.ibanFormatted)}</p>
      <p style="margin:0 0 6px 0;font-size:14px;color:#334155;"><strong>Açıklama:</strong> ${escapeHtml(params.orderNo)}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(bank.transferNote)}</p>
    </td>
  </tr>
</table>`
    : ""

  const hint = `<p style="margin:0;padding:12px 14px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:14px;line-height:1.5;color:#92400e;">Ödemenizi yaptıktan sonra dekontunuzu (görsel veya PDF) yükleyin. Onay sonrası siparişiniz hazırlanacaktır.</p>`

  const innerHtml = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
  <tr>
    <td style="padding:16px 18px;">
      <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Sipariş özeti</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">Sipariş no</td>
          <td align="right" style="padding:6px 0;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(params.orderNo)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">Toplam</td>
          <td align="right" style="padding:6px 0;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(params.grandTotal)} TL</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">Ödeme</td>
          <td align="right" style="padding:6px 0;font-size:14px;color:#334155;">${escapeHtml(pm)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
${bankHtml}
${hint}
`

  const html = transactionalEmailHtml({
    siteUrl: params.siteUrl,
    storeName: store,
    preheader: `Sipariş no ${params.orderNo} — ${params.grandTotal} TL`,
    title: "Siparişiniz alındı",
    lead: "Merhaba, siparişiniz başarıyla kaydedildi. Havale/EFT ile ödeme talimatları aşağıdadır.",
    innerHtml,
    primaryCta: { href: ordersLink, label: "Dekont yükle" },
  })

  return { subject, text, html }
}
