/** Analytics event adları — PII gönderilmez. */
export type AnalyticsEventName =
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "purchase"
  | "search"
  | "add_to_wishlist"
  | "return_request"

export type AnalyticsItem = {
  item_id: string
  item_name: string
  price?: number
  quantity?: number
  item_category?: string
}

export type AnalyticsEventPayload = {
  currency?: string
  value?: number
  search_term?: string
  transaction_id?: string
  items?: AnalyticsItem[]
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    ttq?: { track: (...args: unknown[]) => void; page: () => void }
    dataLayer?: unknown[]
  }
}

function pushDataLayer(event: AnalyticsEventName, payload: AnalyticsEventPayload) {
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event, ...payload })
}

export function trackAnalyticsEvent(
  event: AnalyticsEventName,
  payload: AnalyticsEventPayload = {}
): void {
  if (typeof window === "undefined") return

  pushDataLayer(event, payload)

  if (typeof window.gtag === "function") {
    window.gtag("event", event, payload)
  }

  if (typeof window.fbq === "function") {
    if (event === "purchase" && payload.transaction_id) {
      window.fbq("track", "Purchase", {
        value: payload.value,
        currency: payload.currency ?? "TRY",
        content_ids: payload.items?.map((i) => i.item_id),
      })
    } else if (event === "add_to_cart") {
      window.fbq("track", "AddToCart", { value: payload.value, currency: payload.currency ?? "TRY" })
    } else if (event === "view_item") {
      window.fbq("track", "ViewContent", { value: payload.value, currency: payload.currency ?? "TRY" })
    } else if (event === "search") {
      window.fbq("track", "Search", { search_string: payload.search_term })
    }
  }

  if (window.ttq?.track) {
    if (event === "purchase") {
      window.ttq.track("CompletePayment", { value: payload.value, currency: payload.currency ?? "TRY" })
    } else if (event === "add_to_cart") {
      window.ttq.track("AddToCart", { value: payload.value, currency: payload.currency ?? "TRY" })
    }
  }
}
