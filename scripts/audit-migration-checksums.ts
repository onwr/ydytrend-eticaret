import "dotenv/config"
import { createConnection } from "mariadb"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const MIGRATION = "20260621115900_baseline_missing_schema"

const DATABASES = ["littlemomstore", "ydytrend_runtime_test"] as const

function listMigrationNames(): string[] {
  const dir = join(process.cwd(), "prisma/migrations")
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}

async function queryMigrations(dbName: string) {
  const base = process.env.DATABASE_URL?.trim()
  if (!base) throw new Error("DATABASE_URL missing")

  const parsed = new URL(base)
  const conn = await createConnection({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: dbName,
    allowPublicKeyRetrieval: parsed.searchParams.get("allowPublicKeyRetrieval") === "true",
  })

  const rows = await conn.query<
    { migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null }[]
  >(
    `SELECT migration_name, checksum, finished_at, rolled_back_at
     FROM _prisma_migrations
     ORDER BY migration_name`
  )
  await conn.end()
  return rows
}

async function main() {
  const migrationPath = join(process.cwd(), "prisma/migrations", MIGRATION, "migration.sql")
  const fileChecksum = sha256File(migrationPath)

  console.log("=== File checksum (current working tree) ===")
  console.log(`${MIGRATION}: ${fileChecksum}`)

  for (const db of DATABASES) {
    console.log(`\n=== DB: ${db} ===`)
    try {
      const rows = await queryMigrations(db)
      const baseline = rows.find((r) => r.migration_name === MIGRATION)
      if (baseline) {
        console.log(`Recorded checksum: ${baseline.checksum}`)
        console.log(`Matches file: ${baseline.checksum === fileChecksum ? "YES" : "NO"}`)
        console.log(`finished_at: ${baseline.finished_at}`)
        console.log(`rolled_back_at: ${baseline.rolled_back_at ?? "null"}`)
      } else {
        console.log("Baseline migration not found in _prisma_migrations")
      }
      console.log(`Applied 202606* migrations: ${rows.filter((r) => r.finished_at && !r.rolled_back_at).length}`)
    } catch (err) {
      console.log(`Error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Full migration checksum audit for littlemomstore
  console.log("\n=== Full migration checksum audit (littlemomstore) ===")
  const allNames = listMigrationNames()
  const allRows = await queryMigrations("littlemomstore")
  const rowByName = new Map(allRows.map((r) => [r.migration_name, r]))
  let mismatches = 0
  for (const name of allNames) {
    const row = rowByName.get(name)
    if (!row?.finished_at || row.rolled_back_at) continue
    const p = join(process.cwd(), "prisma/migrations", name, "migration.sql")
    const current = sha256File(p)
    if (current !== row.checksum) {
      mismatches++
      console.log(`MISMATCH: ${name}`)
      console.log(`  DB:     ${row.checksum}`)
      console.log(`  File:   ${current}`)
    }
  }
  console.log(mismatches === 0 ? "All applied migrations match file checksums." : `${mismatches} mismatch(es).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
