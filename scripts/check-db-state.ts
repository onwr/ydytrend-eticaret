import "dotenv/config"
import { prisma } from "../lib/prisma"

async function main() {
  const cols = await prisma.$queryRawUnsafe<Array<{ Field: string }>>("SHOW COLUMNS FROM Slider")
  console.log("Slider columns:", cols.map((c) => c.Field).join(", "))

  const paymentCols = await prisma.$queryRawUnsafe<Array<{ Field: string }>>("SHOW COLUMNS FROM Payment")
  console.log("Payment columns:", paymentCols.map((c) => c.Field).join(", "))

  const attrTable = await prisma.$queryRawUnsafe<Array<Record<string, string>>>(
    "SHOW TABLES LIKE 'Attribute'"
  )
  console.log("Attribute table:", attrTable.length > 0 ? "yes" : "no")

  const migs = await prisma.$queryRawUnsafe<
    Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>
  >("SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at")
  for (const m of migs) {
    console.log(m.migration_name, m.finished_at ? "OK" : m.rolled_back_at ? "ROLLED_BACK" : "FAILED/PENDING")
  }
}

main()
  .finally(() => prisma.$disconnect())
