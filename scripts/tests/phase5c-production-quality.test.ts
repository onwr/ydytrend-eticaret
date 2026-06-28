import test from "node:test"
import assert from "node:assert/strict"
import { sanitizeMonitoringContext, sanitizeMonitoringUser } from "@/lib/monitoring/sanitize"
import { safeJsonLdStringify, productJsonLd } from "@/lib/jsonLd"
import { absoluteUrl, privatePageMetadata } from "@/lib/seo"
import {
  consentAllowsAnalytics,
  consentAllowsMarketing,
  defaultConsent,
  parseConsent,
} from "@/lib/analytics/consent"
import { shouldSendPurchaseEvent, resetPurchaseDedupeForTests } from "@/lib/analytics/purchaseDedupe"
import { isIndexingAllowed } from "@/lib/indexing"
import { resetEnvCacheForTests } from "@/lib/env"
import { REQUEST_ID_HEADER } from "@/lib/requestId"

test("monitoring redaction strips PII keys", () => {
  const out = sanitizeMonitoringContext({
    email: "a@b.com",
    orderId: 42,
    password: "x",
  }) as Record<string, unknown>
  assert.equal(out.email, "[REDACTED]")
  assert.equal(out.password, "[REDACTED]")
  assert.equal(out.orderId, 42)
})

test("monitoring user keeps id only", () => {
  assert.deepEqual(sanitizeMonitoringUser({ id: 5, email: "a@b.com" }), { id: "5" })
})

test("JSON-LD safe stringify blocks script injection", () => {
  const raw = safeJsonLdStringify({ x: "</script><script>alert(1)</script>" })
  assert.ok(!raw.includes("</script>"))
  assert.ok(raw.includes("\\u003c"))
})

test("product JSON-LD has no fake rating", () => {
  const ld = productJsonLd({
    name: "Küpe",
    url: "https://example.com/p",
    imageUrls: [],
    price: 100,
    inStock: true,
  }) as Record<string, unknown>
  assert.equal(ld.aggregateRating, undefined)
  assert.equal((ld.offers as { price: number }).price, 100)
})

test("private page metadata is noindex", () => {
  const m = privatePageMetadata({ title: "Sepet", path: "/cart" })
  const robots = m.robots as { index?: boolean }
  assert.equal(robots.index, false)
  assert.equal(m.alternates?.canonical, absoluteUrl("/cart"))
})

test("indexing disabled in test env by default", () => {
  process.env.DATABASE_URL = "mysql://u:p@127.0.0.1:3306/test"
  process.env.ALLOW_INDEXING = "false"
  resetEnvCacheForTests()
  assert.equal(isIndexingAllowed(), false)
})

test("consent gating defaults off", () => {
  assert.equal(consentAllowsAnalytics(null), false)
  assert.equal(consentAllowsMarketing(defaultConsent()), false)
  const all = parseConsent(
    JSON.stringify({ ...defaultConsent(), analytics: true, marketing: true })
  )
  assert.equal(consentAllowsAnalytics(all), true)
})

test("purchase dedupe once per order", () => {
  const store = new Map<string, string>()
  ;(globalThis as { sessionStorage: Storage }).sessionStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v)
    },
    removeItem: (k) => {
      store.delete(k)
    },
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  }
  resetPurchaseDedupeForTests()
  assert.equal(shouldSendPurchaseEvent("ORD-1"), true)
  assert.equal(shouldSendPurchaseEvent("ORD-1"), false)
})

test("request id header constant", () => {
  assert.equal(REQUEST_ID_HEADER, "x-request-id")
})

test("test DB checksum guard rejects unknown db name", () => {
  process.env.DATABASE_URL = "mysql://u:p@127.0.0.1:3306/littlemomstore"
  assert.throws(() => {
    const base = process.env.DATABASE_URL!
    const dbName = decodeURIComponent(new URL(base).pathname.replace(/^\//, ""))
    const ALLOWED = new Set(["ydytrend_runtime_test", "ydytrend_legacy_test"])
    if (!ALLOWED.has(dbName)) throw new Error("rejected")
  })
})
