import test from "node:test"
import assert from "node:assert/strict"
import nodemailer from "nodemailer"
import { buildSmtpTransportOptions, sendMailWithConfig } from "@/lib/smtpSettings"
import { computeNextAttemptAt } from "@/lib/email/outbox"
import { sanitizeAnalyticsPayload } from "@/lib/analytics/trackSafe"
import { consentAllowsAnalytics, parseConsent, defaultConsent } from "@/lib/analytics/consent"
import { shouldSendPurchaseEvent, resetPurchaseDedupeForTests } from "@/lib/analytics/purchaseDedupe"
import { isPathTraversalAttempt, UPLOAD_CLEANUP_ALLOWLIST } from "@/lib/cron/uploadCleanup"
import { maskEmail } from "@/lib/logRedaction"

test("nodemailer 9 jsonTransport sends mail", async () => {
  const transport = nodemailer.createTransport({ jsonTransport: true })
  const info = await transport.sendMail({
    from: "test@example.com",
    to: "buyer@example.com",
    subject: "Test",
    html: "<p>Merhaba</p>",
    text: "Merhaba",
  })
  assert.ok(info.messageId)
  const parsed = JSON.parse(info.message as string) as { subject: string }
  assert.equal(parsed.subject, "Test")
})

test("smtp transport options include timeouts", () => {
  const opts = buildSmtpTransportOptions({
    host: "smtp.example.com",
    port: 587,
    encryption: "tls",
    user: "u",
    password: "p",
    fromEmail: "from@example.com",
    fromName: "YDY",
    autoTls: true,
  })
  assert.equal(opts.connectionTimeout, 10_000)
  assert.equal(opts.socketTimeout, 30_000)
})

test("email outbox retry backoff grows exponentially", () => {
  process.env.EMAIL_OUTBOX_RETRY_MINUTES = "5"
  const a1 = computeNextAttemptAt(1)
  const a2 = computeNextAttemptAt(2)
  assert.ok(a2.getTime() > a1.getTime())
})

test("analytics payload strips PII keys via sanitize", () => {
  const out = sanitizeAnalyticsPayload({
    currency: "TRY",
    value: 100,
    items: [{ item_id: "1", item_name: "Küpe", price: 100, quantity: 1 }],
  })
  assert.equal(out.currency, "TRY")
  assert.equal((out.items as unknown[]).length, 1)
})

test("analytics consent gating blocks without consent", () => {
  assert.equal(consentAllowsAnalytics(null), false)
  const denied = parseConsent(JSON.stringify(defaultConsent()))
  assert.equal(consentAllowsAnalytics(denied), false)
})

test("purchase dedupe prevents duplicate orderId", () => {
  const store = new Map<string, string>()
  ;(globalThis as { sessionStorage: Storage }).sessionStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  }
  resetPurchaseDedupeForTests()
  assert.equal(shouldSendPurchaseEvent("ORD-99"), true)
  assert.equal(shouldSendPurchaseEvent("ORD-99"), false)
})

test("upload cleanup rejects path traversal", () => {
  assert.equal(isPathTraversalAttempt("receipts", ["..", "secret.txt"]), true)
  assert.equal(isPathTraversalAttempt("receipts", ["file.jpg"]), false)
  assert.equal(isPathTraversalAttempt("evil", ["file.jpg"]), true)
})

test("upload allowlist is restricted", () => {
  assert.ok(UPLOAD_CLEANUP_ALLOWLIST.includes("receipts"))
  assert.ok(!(UPLOAD_CLEANUP_ALLOWLIST as readonly string[]).includes("products"))
})

test("recipient masking in logs", () => {
  assert.match(maskEmail("alice@example.com"), /\*\*\*@example\.com/)
})

test("sendMailWithConfig rejects missing host", async () => {
  await assert.rejects(
    () =>
      sendMailWithConfig(
        {
          host: "",
          port: 587,
          encryption: "tls",
          user: "u",
          password: "p",
          fromEmail: "from@example.com",
          fromName: "",
          autoTls: true,
        },
        { to: "a@b.com", subject: "x", text: "y" }
      ),
    /SMTP sunucusu/
  )
})
