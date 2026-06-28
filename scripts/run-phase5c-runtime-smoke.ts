/**
 * Faz 5C runtime smoke — yerel dev server gerekir (npm run dev).
 */
import "dotenv/config"

type Result = { name: string; ok: boolean; detail?: string }

const BASE = process.env.RUNTIME_TEST_BASE_URL?.trim() || "http://localhost:3000"

async function check(name: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn()
    return { name, ok: true }
  } catch (e) {
    return { name, ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

async function main() {
  console.log(`\n=== Faz 5C Runtime Smoke (${BASE}) ===\n`)
  const results: Result[] = []

  results.push(
    await check("GET /api/health", async () => {
      const res = await fetch(`${BASE}/api/health`)
      if (!res.ok) throw new Error(`status ${res.status}`)
      const body = (await res.json()) as { status?: string }
      if (body.status !== "ok") throw new Error("health not ok")
    })
  )

  results.push(
    await check("GET /api/readiness", async () => {
      const res = await fetch(`${BASE}/api/readiness`)
      const body = (await res.json()) as { status?: string; checks?: Record<string, string> }
      if (!body.status || !body.checks) throw new Error("invalid readiness body")
    })
  )

  results.push(
    await check("GET /robots.txt", async () => {
      const res = await fetch(`${BASE}/robots.txt`)
      const text = await res.text()
      if (!text.includes("Disallow")) throw new Error("robots missing disallow")
    })
  )

  results.push(
    await check("GET /sitemap.xml", async () => {
      const res = await fetch(`${BASE}/sitemap.xml`)
      if (res.status !== 200) throw new Error(`status ${res.status}`)
    })
  )

  results.push(
    await check("Cron auth rejects missing secret", async () => {
      const res = await fetch(`${BASE}/api/cron/maintenance`, { method: "POST" })
      if (res.status !== 403) throw new Error(`expected 403 got ${res.status}`)
    })
  )

  for (const r of results) {
    console.log(`  [${r.ok ? "PASS" : "FAIL"}] ${r.name}${r.detail ? ` — ${r.detail}` : ""}`)
  }

  const failed = results.filter((r) => !r.ok).length
  console.log(`\n=== Sonuç: ${results.length - failed}/${results.length} PASS ===\n`)
  if (failed > 0) process.exit(1)
}

main()
