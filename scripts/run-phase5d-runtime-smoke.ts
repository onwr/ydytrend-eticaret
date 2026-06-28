/**
 * Faz 5D runtime smoke — health, cron auth, new endpoints.
 */
const BASE = process.env.RUNTIME_TEST_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"

type Result = { name: string; ok: boolean; detail?: string }

async function run(): Promise<Result[]> {
  const results: Result[] = []

  async function check(name: string, fn: () => Promise<void>) {
    try {
      await fn()
      results.push({ name, ok: true })
    } catch (e) {
      results.push({
        name,
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      })
    }
  }

  await check("GET /api/health", async () => {
    const res = await fetch(`${BASE}/api/health`)
    if (!res.ok) throw new Error(`status ${res.status}`)
  })

  await check("GET /api/readiness", async () => {
    const res = await fetch(`${BASE}/api/readiness`)
    if (!res.ok) throw new Error(`status ${res.status}`)
  })

  await check("Cron email-outbox auth rejects missing secret", async () => {
    const res = await fetch(`${BASE}/api/cron/email-outbox`, { method: "POST" })
    if (res.status !== 403) throw new Error(`expected 403 got ${res.status}`)
  })

  await check("Cron upload-cleanup auth rejects missing secret", async () => {
    const res = await fetch(`${BASE}/api/cron/upload-cleanup`, { method: "POST" })
    if (res.status !== 403) throw new Error(`expected 403 got ${res.status}`)
  })

  await check("GET /robots.txt", async () => {
    const res = await fetch(`${BASE}/robots.txt`)
    if (!res.ok) throw new Error(`status ${res.status}`)
  })

  return results
}

async function main() {
  console.log(`\n=== Faz 5D Runtime Smoke (${BASE}) ===\n`)
  const results = await run()
  let pass = 0
  for (const r of results) {
    console.log(`  [${r.ok ? "PASS" : "FAIL"}] ${r.name}${r.detail ? ` — ${r.detail}` : ""}`)
    if (r.ok) pass++
  }
  console.log(`\n=== Sonuç: ${pass}/${results.length} PASS ===\n`)
  if (pass !== results.length) process.exit(1)
}

main()
