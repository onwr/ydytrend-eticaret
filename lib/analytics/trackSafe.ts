import {
  consentAllowsAnalytics,
  CONSENT_STORAGE_KEY,
  parseConsent,
} from "@/lib/analytics/consent"
import { trackAnalyticsEvent, type AnalyticsEventName, type AnalyticsEventPayload } from "@/lib/analytics/events"

const PII_PAYLOAD_KEYS = new Set([
  "email",
  "phone",
  "telephone",
  "name",
  "fullName",
  "address",
  "shipping_address",
  "billing_address",
  "customerNote",
  "note",
  "iban",
  "authorization",
  "token",
])

function getStoredConsent() {
  if (typeof window === "undefined") return null
  return parseConsent(localStorage.getItem(CONSENT_STORAGE_KEY))
}

export function sanitizeAnalyticsPayload(
  payload: AnalyticsEventPayload
): AnalyticsEventPayload {
  const out: AnalyticsEventPayload = { currency: payload.currency ?? "TRY" }
  if (payload.value != null) out.value = payload.value
  if (payload.search_term) out.search_term = payload.search_term.slice(0, 120)
  if (payload.transaction_id) out.transaction_id = payload.transaction_id
  if (payload.items) {
    out.items = payload.items.map((item) => ({
      item_id: item.item_id,
      item_name: item.item_name.slice(0, 120),
      price: item.price,
      quantity: item.quantity,
      item_category: item.item_category?.slice(0, 80),
    }))
  }
  return out
}

/** Consent kontrolü + PII temizliği + hata yutma — storefront event'leri için. */
export function trackAnalyticsEventSafe(
  event: AnalyticsEventName,
  payload: AnalyticsEventPayload = {}
): void {
  if (typeof window === "undefined") return
  try {
    if (!consentAllowsAnalytics(getStoredConsent())) return
    for (const key of Object.keys(payload)) {
      if (PII_PAYLOAD_KEYS.has(key)) return
    }
    trackAnalyticsEvent(event, sanitizeAnalyticsPayload(payload))
  } catch {
    /* analytics must not break checkout */
  }
}

export function cartLinesToAnalyticsItems(
  lines: Array<{
    productId?: number
    name: string
    unitPrice?: number
    quantity: number
    categoryName?: string | null
  }>
) {
  return lines.map((line) => ({
    item_id: String(line.productId ?? line.name),
    item_name: line.name,
    price: line.unitPrice,
    quantity: line.quantity,
    item_category: line.categoryName ?? undefined,
  }))
}
