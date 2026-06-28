/** Ortak transaksiyonel e-posta HTML iskeleti (tablo tabanlı, Outlook uyumu). */

import { COLOR_PRIMARY, COLOR_PAGE_BG } from "@/lib/brand"

const BG_PAGE = "#f5f0ee"  // sıcak kırık beyaz — e-posta arkaplanı
const TEXT_MUTED = "#746C6B"
const TEXT_BODY = "#232020"

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type TransactionalEmailParams = {
  siteUrl: string
  storeName: string
  /** Gelen kutusu önizleme (birçok istemci ilk satırı gösterir) */
  preheader?: string
  /** Ana başlık (H1) */
  title: string
  /** Kısa giriş cümlesi */
  lead?: string
  /** Kart içi ek HTML (liste, kutular); güvenilir içerik için */
  innerHtml: string
  primaryCta: { href: string; label: string }
  footerExtraHtml?: string
}

export function transactionalEmailHtml(p: TransactionalEmailParams): string {
  const base = p.siteUrl.replace(/\/$/, "")
  const pre = p.preheader?.trim()
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(p.preheader!.slice(0, 140))}</div>`
    : ""
  const titleEsc = escapeHtml(p.title)
  const storeEsc = escapeHtml(p.storeName)
  const leadBlock = p.lead
    ? `<p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:${TEXT_BODY};">${escapeHtml(p.lead)}</p>`
    : ""

  const ctaHref = p.primaryCta.href
  const ctaLabel = escapeHtml(p.primaryCta.label)

  // Başlık çubuğu rengi: mat altın (YDY Trend birincil renk)
  const headerBg = COLOR_PRIMARY

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="tr">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${titleEsc}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_PAGE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
${pre}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BG_PAGE};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background-color:${headerBg};border-radius:12px 12px 0 0;padding:22px 28px;">
            <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">${storeEsc}</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;padding:32px 28px 28px 28px;border:1px solid #EDE4E2;border-top:none;border-radius:0 0 12px 12px;">
            <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;line-height:1.25;color:#232020;letter-spacing:-0.02em;">${titleEsc}</h1>
            ${leadBlock}
            ${p.innerHtml}
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px 0;">
              <tr>
                <td align="center" bgcolor="${headerBg}" style="border-radius:8px;mso-padding-alt:14px 28px;">
                  <a href="${ctaHref.replace(/"/g, "&quot;")}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${ctaLabel}</a>
                </td>
              </tr>
            </table>
            ${p.footerExtraHtml ?? ""}
            <p style="margin:28px 0 0 0;font-size:13px;line-height:1.5;color:${TEXT_MUTED};">
              Sorularınız için <a href="${base.replace(/"/g, "&quot;")}" style="color:${headerBg};text-decoration:underline;">${escapeHtml(base.replace(/^https?:\/\//, ""))}</a> adresinden mağazamıza dönebilirsiniz.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 12px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${storeEsc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
