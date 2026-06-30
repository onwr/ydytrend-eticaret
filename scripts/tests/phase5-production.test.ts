import test from "node:test"
import assert from "node:assert/strict"
import { requiresCsrfCheck, validateApiOrigin, isCsrfExemptPath } from "@/lib/csrf"
import { consumeRateLimitSync } from "@/lib/rateLimit"
import { resetEnvCacheForTests } from "@/lib/env"

test("CSRF path rules", () => {
  assert.equal(requiresCsrfCheck("POST", "/api/orders"), true)
  assert.equal(requiresCsrfCheck("GET", "/api/orders"), false)
  assert.equal(isCsrfExemptPath("/api/payment/callback"), true)
  assert.equal(requiresCsrfCheck("POST", "/api/payment/callback"), false)
})

test("CSRF origin validation", () => {
  process.env.DATABASE_URL = "mysql://u:p@127.0.0.1:3306/test"
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000"
  resetEnvCacheForTests()
  const ok = validateApiOrigin(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
    })
  )
  assert.equal(ok.ok, true)

  const bad = validateApiOrigin(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "content-type": "application/json",
      },
    })
  )
  assert.equal(bad.ok, false)
})

test("CSRF allows localhost origin in development when SITE_URL is production", () => {
  process.env.NODE_ENV = "development"
  process.env.DATABASE_URL = "mysql://u:p@127.0.0.1:3306/test"
  process.env.NEXT_PUBLIC_SITE_URL = "https://ydytrend.com"
  resetEnvCacheForTests()
  const ok = validateApiOrigin(
    new Request("http://localhost:3000/api/admin/navigation/announcements", {
      method: "PUT",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
    })
  )
  assert.equal(ok.ok, true)
  resetEnvCacheForTests()
})

test("rate limit sync bucket", () => {
  const key = `test:${Date.now()}`
  assert.equal(consumeRateLimitSync(key, 2, 60_000).allowed, true)
  assert.equal(consumeRateLimitSync(key, 2, 60_000).allowed, true)
  assert.equal(consumeRateLimitSync(key, 2, 60_000).allowed, false)
})
