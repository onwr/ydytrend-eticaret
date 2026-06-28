/**
 * Eski `attributesJson` verilerini yeni ilişkisel tablolara geçirir.
 *
 * Kullanım:
 *   npx ts-node --project tsconfig.json scripts/migrate-variant-attributes.ts        # dry-run
 *   npx ts-node --project tsconfig.json scripts/migrate-variant-attributes.ts --apply # uygula
 *   npx ts-node --project tsconfig.json scripts/migrate-variant-attributes.ts --apply --production-confirm # production'da uygula
 *
 * Güvenceler:
 * - `--apply` olmadan hiçbir yazma işlemi yapılmaz.
 * - Hatalı JSON bütün scripti durdurmaz; atlar ve loglar.
 * - Zaten ilişkisel kaydı olan varyantları atlar.
 * - Duplicate üretmez (skipDuplicates).
 * - Her varyant için transaction kullanır.
 * - Production'da `--production-confirm` bayrağı zorunludur.
 */

import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "../generated/prisma/client"
import * as dotenv from "dotenv"

dotenv.config()

const DRY_RUN = !process.argv.includes("--apply")
const PRODUCTION_CONFIRM = process.argv.includes("--production-confirm")
const IS_PRODUCTION =
  process.env.NODE_ENV === "production" ||
  (process.env.DATABASE_URL ?? "").includes("prod")

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL tanımlı değil.")

const adapter = new PrismaMariaDb(url)
const prisma = new PrismaClient({ adapter })

type AttrEntry = { slug: string; name: string; value: string }

async function run() {
  if (IS_PRODUCTION && !DRY_RUN && !PRODUCTION_CONFIRM) {
    console.error(
      "HATA: Production veritabanında --apply kullanmak için --production-confirm bayrağını ekleyin."
    )
    process.exit(1)
  }

  const mode = DRY_RUN ? "[DRY-RUN]" : "[APPLY]"
  console.log(`\n${mode} Varyant attribute geçişi başlıyor...\n`)

  // Tüm attribute'ları slug → id map'i olarak çek
  const allAttributes = await prisma.attribute.findMany({
    select: { id: true, slug: true, name: true },
  })
  const allValues = await prisma.attributeValue.findMany({
    select: { id: true, attributeId: true, slug: true, value: true },
  })

  const attrBySlug = new Map(allAttributes.map((a) => [a.slug, a]))
  const valueByAttrAndSlug = new Map(
    allValues.map((v) => [`${v.attributeId}:${v.slug}`, v])
  )
  const valueByAttrAndValue = new Map(
    allValues.map((v) => [`${v.attributeId}:${v.value.toLowerCase()}`, v])
  )

  // `attributesJson` dolu ve henüz ilişkisel kaydı olmayan varyantları çek
  const variants = await prisma.productVariant.findMany({
    where: {
      attributesJson: { not: null },
      attributeValues: { none: {} },
    },
    select: {
      id: true,
      sku: true,
      attributesJson: true,
    },
  })

  console.log(`Toplam geçirilecek varyant: ${variants.length}\n`)

  let processed = 0
  let skipped = 0
  let errors = 0

  for (const variant of variants) {
    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(variant.attributesJson!) as Record<string, string>
    } catch {
      console.warn(`[SKIP] Variant #${variant.id} (${variant.sku}): Geçersiz JSON`)
      skipped++
      continue
    }

    const entries: AttrEntry[] = Object.entries(parsed)
      .filter(([, v]) => typeof v === "string" && v.length > 0)
      .map(([key, value]) => ({
        slug: key.toLowerCase().replace(/\s+/g, "-"),
        name: key,
        value: String(value),
      }))

    if (entries.length === 0) {
      console.warn(`[SKIP] Variant #${variant.id}: Boş attribute listesi`)
      skipped++
      continue
    }

    const pairs: { attributeId: number; valueId: number }[] = []
    let hasError = false

    for (const entry of entries) {
      const attr = attrBySlug.get(entry.slug)
      if (!attr) {
        console.warn(
          `[WARN] Variant #${variant.id}: Attribute bulunamadı: "${entry.slug}" (JSON key: "${entry.name}")`
        )
        hasError = true
        continue
      }

      // Önce slug ile dene, sonra value ile
      const valueSlug = entry.value.toLowerCase().replace(/\s+/g, "-")
      const val =
        valueByAttrAndSlug.get(`${attr.id}:${valueSlug}`) ??
        valueByAttrAndValue.get(`${attr.id}:${entry.value.toLowerCase()}`)

      if (!val) {
        console.warn(
          `[WARN] Variant #${variant.id}: AttributeValue bulunamadı: "${entry.name}" = "${entry.value}"`
        )
        hasError = true
        continue
      }

      pairs.push({ attributeId: attr.id, valueId: val.id })
    }

    if (pairs.length === 0) {
      console.warn(`[SKIP] Variant #${variant.id}: Eşleşen attribute/value çifti bulunamadı`)
      skipped++
      continue
    }

    console.log(
      `${mode} Variant #${variant.id} (${variant.sku}): ${pairs.length} özellik${hasError ? " (bazı özellikler atlandı)" : ""}`
    )

    if (!DRY_RUN) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.productVariantAttributeValue.createMany({
            data: pairs.map((p) => ({ variantId: variant.id, ...p })),
            skipDuplicates: true,
          })
        })
        processed++
      } catch (e) {
        console.error(`[ERROR] Variant #${variant.id}: ${e instanceof Error ? e.message : String(e)}`)
        errors++
      }
    } else {
      processed++
    }
  }

  console.log(`
${mode} Geçiş tamamlandı:
  ✓ İşlendi : ${processed}
  ⚠ Atlandı : ${skipped}
  ✗ Hata    : ${errors}
`)

  if (DRY_RUN) {
    console.log("Bu bir dry-run. Gerçekten uygulamak için --apply bayrağını ekleyin.")
  }
}

run()
  .catch((e) => {
    console.error("Script hatası:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
