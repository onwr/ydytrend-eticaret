import { execSync } from "node:child_process"
import { createConnection } from "mariadb"
import "dotenv/config"

const TEST_DB = "ydytrend_runtime_test"

function buildTestUrl(): string {
  const base = process.env.DATABASE_URL?.trim()
  if (!base) {
    throw new Error("DATABASE_URL tanımlı değil. Ana .env okunmalı; kalıcı değiştirme yapılmaz.")
  }
  return base.replace(/\/[^/?]+(\?|$)/, `/${TEST_DB}$1`)
}

const ALLOWED_DROP_DATABASES = new Set(["ydytrend_runtime_test", "ydytrend_legacy_test"])

function assertAllowedDrop(dbName: string) {
  if (!ALLOWED_DROP_DATABASES.has(dbName)) {
    throw new Error(
      `Güvenlik: "${dbName}" veritabanı drop edilemez. İzin verilen: ${[...ALLOWED_DROP_DATABASES].join(", ")}`
    )
  }
}

async function recreateDatabase(adminUrl: string) {
  assertAllowedDrop(TEST_DB)
  const parsed = new URL(adminUrl)
  const database = parsed.pathname.replace(/^\//, "")
  const conn = await createConnection({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: database || undefined,
    allowPublicKeyRetrieval: parsed.searchParams.get("allowPublicKeyRetrieval") === "true",
  })

  await conn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``)
  await conn.query(
    `CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  await conn.end()
}

async function main() {
  const adminUrl = process.env.DATABASE_URL
  if (!adminUrl) throw new Error("DATABASE_URL gerekli")

  const testUrl = buildTestUrl()
  console.log(`Recreating database: ${TEST_DB}`)
  await recreateDatabase(adminUrl)

  console.log("Applying migrations...")
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  })

  console.log("Seeding test data...")
  execSync("npx prisma db seed", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  })

  console.log("Creating runtime test admin...")
  execSync(
    'npm run admin:create -- --email runtime-test@ydytrend.local --password "RuntimeTest2026!" --name "Runtime Test Admin"',
    {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    }
  )

  console.log(`\nTest database ready: ${TEST_DB}`)
  console.log("Ana .env dosyası değiştirilmedi.")
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
