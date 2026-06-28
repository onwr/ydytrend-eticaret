import test from "node:test"
import assert from "node:assert/strict"
import { redactString, redactValue, maskEmail, maskIban } from "@/lib/logRedaction"
import { resolveRequestId, REQUEST_ID_HEADER } from "@/lib/requestId"
import { getUptimeSeconds, APP_STARTED_AT } from "@/lib/appLifecycle"
import { resetEnvCacheForTests, getEnv } from "@/lib/env"

test("log redaction masks secrets", () => {
  assert.equal(maskEmail("admin@example.com"), "a***@example.com")
  const ibanMasked = maskIban("TR330006100519786457841326")
  assert.ok(ibanMasked.endsWith("1326"))
  assert.equal(redactString("eyJhbGciOiJIUzI1NiJ9.abc.def"), "[REDACTED_JWT]")
  assert.equal(redactString("mysql://user:pass@host/db"), "[REDACTED_DATABASE_URL]")

  const out = redactValue({
    password: "secret123",
    note: "ok",
    nested: { authorization: "Bearer x" },
  }) as Record<string, unknown>
  assert.equal(out.password, "[REDACTED]")
  assert.equal((out.nested as Record<string, unknown>).authorization, "[REDACTED]")
})

test("request id validation", () => {
  const valid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  assert.equal(resolveRequestId(valid), valid)
  assert.match(resolveRequestId("bad id!"), /^[0-9a-f-]{36}$/i)
  assert.match(resolveRequestId(null), /^[0-9a-f-]{36}$/i)
  assert.equal(REQUEST_ID_HEADER, "x-request-id")
})

test("uptime helper", () => {
  assert.ok(APP_STARTED_AT <= Date.now())
  assert.ok(getUptimeSeconds() >= 0)
})

test("env cache for logging", () => {
  process.env.DATABASE_URL = "mysql://u:p@127.0.0.1:3306/test"
  resetEnvCacheForTests()
  assert.ok(getEnv().DATABASE_URL.includes("test"))
})
