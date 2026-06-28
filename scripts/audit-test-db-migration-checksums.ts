import "dotenv/config"
import { createConnection } from "mariadb"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const ALLOWED_DBS = new Set(["ydytrend_runtime_test", "ydytrend_legacy_test"])

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

function resolveTargetDb(): string {
  const base = process.env.DATABASE_URL?.trim()
  if (!base) throw new Error("DATABASE_URL tanımlı değil.")

  let dbName: string
  try {
    dbName = decodeURIComponent(new URL(base).pathname.replace(/^\//, ""))
  } catch {
    throw new Error("DATABASE_URL geçersiz.")
  }

  if (!ALLOWED_DBS.has(dbName)) {
    throw new Error(
      `Reddedildi: yalnızca test veritabanları (${[...ALLOWED_DBS].join(", ")}) desteklenir. Algılanan: ${dbName.replace(/./g, "*")}`
    )
  }
  return dbName
}

async function queryMigrations(dbName: string) {
  const base = process.env.DATABASE_URL!.trim()
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
  const dbName = resolveTargetDb()
  console.log(`=== Test DB migration checksum audit ===`)
  console.log(`Target: ${dbName}`)

  const allNames = listMigrationNames()
  const rows = await queryMigrations(dbName)
  const rowByName = new Map(rows.map((r) => [r.migration_name, r]))

  let mismatches = 0
  let missingInDb = 0

  for (const name of allNames) {
    const filePath = join(process.cwd(), "prisma/migrations", name, "migration.sql")
    const fileChecksum = sha256File(filePath)
    const row = rowByName.get(name)

    if (!row?.finished_at || row.rolled_back_at) {
      missingInDb++
      console.log(`SKIP (not applied): ${name}`)
      continue
    }

    if (row.checksum !== fileChecksum) {
      mismatches++
      console.log(`MISMATCH: ${name}`)
      console.log(`  DB file hash differs from working tree`)
    }
  }

  console.log(`\nApplied migrations checked: ${allNames.length - missingInDb}`)
  console.log(`Mismatches: ${mismatches}`)
  if (mismatches > 0) process.exit(1)
  console.log("OK — tüm uygulanmış migration checksumları eşleşiyor.")
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Checksum audit failed")
  process.exit(1)
})
