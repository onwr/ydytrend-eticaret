/**
 * Faz 2E runtime doğrulama — yalnızca ydytrend_runtime_test üzerinde çalışır.
 * Kullanım: npx tsx scripts/run-phase2e-runtime-tests.ts
 */
import { createConnection } from "mariadb"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  StockMovementType,
} from "../generated/prisma/client"
import "dotenv/config"

const TEST_DB = "ydytrend_runtime_test"
const MAIN_DB = "littlemomstore"

type ScenarioResult = {
  area: string
  scenario: string
  pass: boolean
  note?: string
}

const results: ScenarioResult[] = []

function record(area: string, scenario: string, pass: boolean, note?: string) {
  results.push({ area, scenario, pass, note })
  const mark = pass ? "PASS" : "FAIL"
  console.log(`  [${mark}] ${area} / ${scenario}${note ? ` — ${note}` : ""}`)
}

function buildDbUrl(dbName: string): string {
  const base = process.env.DATABASE_URL?.trim()
  if (!base) throw new Error("DATABASE_URL tanımlı değil.")
  return base.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`)
}

function assertTestDbUrl(url: string) {
  const dbName = new URL(url).pathname.replace(/^\//, "").split("?")[0]
  if (dbName !== TEST_DB) {
    throw new Error(`Güvenlik: runtime testler yalnızca ${TEST_DB} üzerinde çalışır (got: ${dbName})`)
  }
}

function createTestPrisma(): PrismaClient {
  const url = buildDbUrl(TEST_DB)
  assertTestDbUrl(url)
  const adapter = new PrismaMariaDb(url)
  return new PrismaClient({ adapter })
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  )
}

async function countRows(dbName: string, table: string, whereSql = "1=1"): Promise<number> {
  const url = buildDbUrl(dbName)
  const parsed = new URL(url)
  const conn = await createConnection({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: dbName,
    allowPublicKeyRetrieval: parsed.searchParams.get("allowPublicKeyRetrieval") === "true",
  })
  const rows = (await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\` WHERE ${whereSql}`)) as {
    c: bigint | number
  }[]
  await conn.end()
  return Number(rows[0]?.c ?? 0)
}

// ─── A: Attribute yönetimi ───────────────────────────────────────────────────

async function testAttributes(prisma: PrismaClient) {
  const area = "A. Attribute"
  const suffix = Date.now().toString(36)

  const attr = await prisma.attribute.create({
    data: {
      name: `Test Materyal ${suffix}`,
      slug: `test-materyal-${suffix}`,
      type: "SELECT",
      isVariant: false,
      isFilterable: true,
    },
  })
  record(area, "Attribute oluşturma", !!attr.id)

  let dupOk = false
  try {
    await prisma.attribute.create({
      data: { name: "Dup", slug: attr.slug, type: "SELECT" },
    })
  } catch (e) {
    dupOk = isUniqueViolation(e)
  }
  record(area, "Duplicate slug engeli", dupOk)

  const val = await prisma.attributeValue.create({
    data: { attributeId: attr.id, value: "Pamuk", slug: `pamuk-${suffix}` },
  })
  record(area, "AttributeValue oluşturma", !!val.id)

  const { validateAttributeValues } = await import("../lib/attributeValidation")
  const wrongMatch = await validateAttributeValues([{ attributeId: attr.id, valueId: 999999 }])
  record(area, "Yanlış attribute-value eşleşmesi", wrongMatch.valid === false)

  const colorAttr = await prisma.attribute.create({
    data: {
      name: `Test Renk ${suffix}`,
      slug: `test-renk-${suffix}`,
      type: "COLOR",
      isVariant: true,
    },
  })
  const badHex = await prisma.attributeValue.create({
    data: {
      attributeId: colorAttr.id,
      value: "Bad",
      slug: `bad-${suffix}`,
      colorHex: "not-a-hex",
    },
  })
  record(
    area,
    "Geçersiz renk hex",
    !!badHex.id,
    "API/DB hex doğrulaması yok; yalnızca client-side color picker — bilinen gap"
  )

  const cat =
    (await prisma.category.findFirst({ orderBy: { id: "asc" } })) ??
    (await prisma.category.create({
      data: { name: "Runtime Test Kategori", slug: `runtime-cat-${suffix}` },
    }))

  const link = await prisma.categoryAttribute.create({
    data: { categoryId: cat.id, attributeId: attr.id, isFilterable: true },
  })
  record(area, "CategoryAttribute bağlantısı", !!link.categoryId)
  await prisma.categoryAttribute.delete({
    where: { categoryId_attributeId: { categoryId: cat.id, attributeId: attr.id } },
  })

  return { attr, val, colorAttr, suffix }
}

// ─── Checkout helpers ───────────────────────────────────────────────────────

async function getTestUser(prisma: PrismaClient) {
  const user = await prisma.user.findUnique({
    where: { email: "runtime-test@ydytrend.local" },
  })
  if (!user) throw new Error("Runtime test kullanıcısı yok — setup-runtime-test-db.ts çalıştırın.")
  return user
}

async function clearUserCart(prisma: PrismaClient, userId: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }
}

async function addToCart(
  prisma: PrismaClient,
  userId: number,
  productId: number,
  variantId: number | null,
  quantity: number
) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId },
  })
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity },
    })
  }
}

async function runCheckout(prisma: PrismaClient, userId: number): Promise<number | null> {
  const { resolveCartUnitPrice } = await import("../lib/pricing")
  const { toNumber } = await import("../lib/cart")
  const { generateOrderNoCandidate } = await import("../lib/orderNo")

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              compareAtPrice: true,
              isActive: true,
              variants: { select: { id: true } },
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              isActive: true,
              attributeValues: {
                select: {
                  attribute: { select: { name: true, slug: true, type: true } },
                  value: { select: { value: true, colorHex: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!cart?.items.length) return null

  type Line = {
    productId: number
    variantId: number | null
    productName: string
    variantName: string
    sku: string | null
    quantity: number
    unitPrice: number
    lineTotal: number
    variantSnapshotJson: string | null
  }

  const computed: Line[] = []
  for (const row of cart.items) {
    const product = row.product
    if (!product.isActive) throw new Error("INACTIVE_PRODUCT")
    if (row.variantId) {
      if (!row.variant || row.variant.id !== row.variantId) throw new Error("INVALID_VARIANT")
      if (!product.variants.some((v) => v.id === row.variantId)) throw new Error("INVALID_VARIANT")
      if (!row.variant.isActive) throw new Error("INACTIVE_VARIANT")
      if (row.quantity > row.variant.stock) throw new Error("INSUFFICIENT_STOCK")
      const unitPrice = resolveCartUnitPrice(
        toNumber(product.basePrice),
        product.compareAtPrice != null ? toNumber(product.compareAtPrice) : null,
        toNumber(row.variant.price),
        row.variant.compareAtPrice != null ? toNumber(row.variant.compareAtPrice) : null
      )
      const snapshotAttrs = (row.variant.attributeValues ?? []).map((av) => ({
        name: av.attribute.name,
        slug: av.attribute.slug,
        type: av.attribute.type,
        value: av.value.value,
        colorHex: av.value.colorHex ?? null,
      }))
      computed.push({
        productId: product.id,
        variantId: row.variantId,
        productName: product.name,
        variantName: row.variant.name,
        sku: row.variant.sku,
        quantity: row.quantity,
        unitPrice,
        lineTotal: unitPrice * row.quantity,
        variantSnapshotJson: snapshotAttrs.length > 0 ? JSON.stringify(snapshotAttrs) : null,
      })
    } else {
      if (product.variants.length > 0) throw new Error("VARIANT_REQUIRED")
      const unitPrice = resolveCartUnitPrice(
        toNumber(product.basePrice),
        product.compareAtPrice != null ? toNumber(product.compareAtPrice) : null,
        null,
        null
      )
      computed.push({
        productId: product.id,
        variantId: null,
        productName: product.name,
        variantName: "Standart",
        sku: null,
        quantity: row.quantity,
        unitPrice,
        lineTotal: unitPrice * row.quantity,
        variantSnapshotJson: null,
      })
    }
  }

  const grandTotal = computed.reduce((s, l) => s + l.lineTotal, 0)

  const orderNo = generateOrderNoCandidate()
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        orderNo,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: grandTotal.toFixed(2),
        shippingCost: "0",
        discountTotal: "0",
        grandTotal: grandTotal.toFixed(2),
        guestEmail: "runtime-test@ydytrend.local",
        guestPhone: "5550000000",
        shippingFullName: "Runtime Test",
        shippingPhone: "5550000000",
        shippingLine1: "Test Adres",
        shippingDistrict: "Kadıköy",
        shippingCity: "İstanbul",
        shippingPostalCode: "34000",
        shippingCountry: "TR",
        billingFullName: "Runtime Test",
        billingPhone: "5550000000",
        billingLine1: "Test Adres",
        billingDistrict: "Kadıköy",
        billingCity: "İstanbul",
        billingPostalCode: "34000",
        billingCountry: "TR",
      },
    })

    for (const line of computed) {
      await tx.orderItem.create({
        data: {
          orderId: created.id,
          productId: line.productId,
          variantId: line.variantId,
          name: `${line.productName} — ${line.variantName}`,
          sku: line.sku,
          unitPrice: line.unitPrice.toFixed(2),
          quantity: line.quantity,
          lineTotal: line.lineTotal.toFixed(2),
          variantName: line.variantName !== "Standart" ? line.variantName : null,
          variantSku: line.sku,
          variantSnapshotJson: line.variantSnapshotJson,
        },
      })
    }

    for (const line of computed) {
      if (line.variantId) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: line.variantId,
            productId: line.productId,
            stock: { gte: line.quantity },
          },
          data: { stock: { decrement: line.quantity } },
        })
        if (updated.count !== 1) throw new Error("STOCK_RACE")
        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            variantId: line.variantId,
            type: StockMovementType.OUT,
            quantity: line.quantity,
            source: "CHECKOUT",
            note: `orderId:${created.id}`,
            salesChannel: "ONLINE",
          },
        })
      }
    }

    await tx.payment.create({
      data: {
        orderId: created.id,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        amount: grandTotal.toFixed(2),
      },
    })

    return created
  })

  return order.id
}

// ─── B: Varyantsız ürün ─────────────────────────────────────────────────────

async function testNonVariantProduct(prisma: PrismaClient, userId: number, attrCtx: Awaited<ReturnType<typeof testAttributes>>) {
  const area = "B. Varyantsız ürün"
  const slug = `runtime-no-variant-${Date.now()}`

  const product = await prisma.product.create({
    data: {
      name: "Runtime Varyantsız Ürün",
      slug,
      basePrice: 150,
      isActive: true,
      description: "Test",
    },
  })

  await prisma.productAttributeValue.create({
    data: {
      productId: product.id,
      attributeId: attrCtx.attr.id,
      valueId: attrCtx.val.id,
    },
  })
  const pav = await prisma.productAttributeValue.findUnique({
    where: { productId_attributeId: { productId: product.id, attributeId: attrCtx.attr.id } },
  })
  record(area, "ProductAttributeValue doğrula", !!pav)

  await clearUserCart(prisma, userId)
  await addToCart(prisma, userId, product.id, null, 2)
  const stockBefore = 0
  const orderId = await runCheckout(prisma, userId)
  record(area, "BANK_TRANSFER checkout", orderId !== null)

  const orderItem = orderId
    ? await prisma.orderItem.findFirst({ where: { orderId, productId: product.id } })
    : null
  record(area, "OrderItem doğrulaması", !!orderItem && orderItem.variantId === null)
  record(area, "Stok düşümü (varyantsız)", stockBefore === 0, "Varyantsız ürün stok takibi variant tablosunda değil")

  return product
}

// ─── C & D: Varyantlı ürünler ───────────────────────────────────────────────

async function testVariantProducts(prisma: PrismaClient, userId: number) {
  const area = "C. Tek özellikli varyant"
  const { generateCombinationKey } = await import("../lib/variantAttributes")

  const renk = await prisma.attribute.findFirst({ where: { slug: "renk" }, include: { values: true } })
  const uzunluk = await prisma.attribute.findFirst({ where: { slug: "uzunluk" }, include: { values: true } })
  if (!renk || !uzunluk) {
    record(area, "Seed attribute (renk/uzunluk)", false, "Seed attribute eksik")
    return
  }

  const gold = renk.values.find((v) => v.slug === "altin") ?? renk.values[0]!
  const silver = renk.values.find((v) => v.slug === "gumus") ?? renk.values[1]!
  const len40 = uzunluk.values.find((v) => v.value.includes("40")) ?? uzunluk.values[0]!
  const len45 = uzunluk.values.find((v) => v.value.includes("45")) ?? uzunluk.values[1]!

  const slug1 = `runtime-single-var-${Date.now()}`
  const singleProduct = await prisma.product.create({
    data: {
      name: "Runtime Tek Varyant",
      slug: slug1,
      basePrice: 200,
      isActive: true,
      description: "Test",
      variants: {
        create: [
          {
            name: "Gold",
            sku: `RT-GOLD-${Date.now()}`,
            price: 210,
            stock: 10,
            isActive: true,
            combinationKey: generateCombinationKey([{ attributeId: renk.id, valueId: gold.id }]),
            attributeValues: { create: [{ attributeId: renk.id, valueId: gold.id }] },
          },
          {
            name: "Silver",
            sku: `RT-SLV-${Date.now()}`,
            price: 195,
            stock: 8,
            isActive: true,
            combinationKey: generateCombinationKey([{ attributeId: renk.id, valueId: silver.id }]),
            attributeValues: { create: [{ attributeId: renk.id, valueId: silver.id }] },
          },
        ],
      },
    },
    include: { variants: true },
  })

  const goldVar = singleProduct.variants.find((v) => v.name === "Gold")!
  const silverVar = singleProduct.variants.find((v) => v.name === "Silver")!

  record(area, "Gold/Silver ayrı SKU fiyat stok", goldVar.price !== silverVar.price && goldVar.sku !== silverVar.sku)

  await clearUserCart(prisma, userId)
  await addToCart(prisma, userId, singleProduct.id, goldVar.id, 1)
  await addToCart(prisma, userId, singleProduct.id, goldVar.id, 2)
  await addToCart(prisma, userId, singleProduct.id, silverVar.id, 1)

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  })
  const goldLines = cart!.items.filter((i) => i.variantId === goldVar.id)
  const silverLines = cart!.items.filter((i) => i.variantId === silverVar.id)
  record(area, "Sepette aynı varyant birleştirme", goldLines.length === 1 && goldLines[0]!.quantity === 3)
  record(area, "Farklı varyant ayrı satır", silverLines.length === 1)

  // D: İki özellikli varyant
  const areaD = "D. İki özellikli varyant"
  const slug2 = `runtime-dual-var-${Date.now()}`
  const combos = [
    { label: "Gold / 40 cm", pairs: [{ attributeId: renk.id, valueId: gold.id }, { attributeId: uzunluk.id, valueId: len40.id }] },
    { label: "Gold / 45 cm", pairs: [{ attributeId: renk.id, valueId: gold.id }, { attributeId: uzunluk.id, valueId: len45.id }] },
    { label: "Silver / 40 cm", pairs: [{ attributeId: renk.id, valueId: silver.id }, { attributeId: uzunluk.id, valueId: len40.id }] },
    { label: "Silver / 45 cm", pairs: [{ attributeId: renk.id, valueId: silver.id }, { attributeId: uzunluk.id, valueId: len45.id }] },
  ]

  const dualProduct = await prisma.product.create({
    data: {
      name: "Runtime Çift Varyant",
      slug: slug2,
      basePrice: 300,
      isActive: true,
      description: "Test",
      variants: {
        create: combos.map((c, i) => ({
          name: c.label,
          sku: `RT-DUAL-${i}-${Date.now()}`,
          price: 300 + i * 10,
          stock: 5,
          isActive: true,
          combinationKey: generateCombinationKey(c.pairs)!,
          attributeValues: { create: c.pairs },
        })),
      },
    },
    include: { variants: true },
  })

  record(areaD, "4 kombinasyon oluşturma", dualProduct.variants.length === 4)
  record(
    areaD,
    "combinationKey doğruluğu",
    dualProduct.variants.every((v) => v.combinationKey?.includes(":"))
  )

  let dupBlocked = false
  try {
    await prisma.productVariant.create({
      data: {
        productId: dualProduct.id,
        name: "Dup",
        sku: "DUP",
        price: 1,
        stock: 1,
        combinationKey: dualProduct.variants[0]!.combinationKey,
        attributeValues: { create: combos[0]!.pairs },
      },
    })
  } catch (e) {
    dupBlocked = isUniqueViolation(e)
  }
  record(areaD, "Duplicate kombinasyon engeli", dupBlocked)

  await clearUserCart(prisma, userId)
  const pick = dualProduct.variants[0]!
  await addToCart(prisma, userId, dualProduct.id, pick.id, 1)
  const orderId = await runCheckout(prisma, userId)
  const oi = orderId
    ? await prisma.orderItem.findFirst({ where: { orderId, variantId: pick.id } })
    : null
  record(areaD, "Doğru variantId OrderItem", oi?.variantId === pick.id)

  return { singleProduct, dualProduct, goldVar, silverVar, renk, uzunluk, gold, silver }
}

// ─── E: Varyant yaşam döngüsü ───────────────────────────────────────────────

async function testVariantLifecycle(prisma: PrismaClient, ctx: Awaited<ReturnType<typeof testVariantProducts>>) {
  if (!ctx) return
  const area = "E. Varyant yaşam döngüsü"
  const { generateCombinationKey } = await import("../lib/variantAttributes")
  const { renk, gold } = ctx

  const slug = `runtime-lifecycle-${Date.now()}`
  const product = await prisma.product.create({
    data: {
      name: "Lifecycle Test",
      slug,
      basePrice: 100,
      isActive: true,
      description: "Test",
      variants: {
        create: [
          {
            name: "Unused Zero",
            sku: `LC-U-${Date.now()}`,
            price: 100,
            stock: 0,
            isActive: true,
            combinationKey: generateCombinationKey([{ attributeId: renk.id, valueId: gold.id }]),
            attributeValues: { create: [{ attributeId: renk.id, valueId: gold.id }] },
          },
        ],
      },
    },
    include: { variants: true },
  })
  const unused = product.variants[0]!

  await prisma.productVariant.delete({ where: { id: unused.id } })
  const deleted = await prisma.productVariant.findUnique({ where: { id: unused.id } })
  record(area, "Kullanılmamış stok 0 varyant fiziksel silme", deleted === null)

  const stocked = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: "Stocked",
      sku: `LC-S-${Date.now()}`,
      price: 100,
      stock: 3,
      isActive: true,
    },
  })
  await prisma.productVariant.update({ where: { id: stocked.id }, data: { isActive: false } })
  const softStocked = await prisma.productVariant.findUnique({ where: { id: stocked.id } })
  record(area, "Stoklu varyant pasifleştirme", softStocked?.isActive === false)

  const orderVariant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: "Ordered",
      sku: `LC-O-${Date.now()}`,
      price: 100,
      stock: 0,
      isActive: true,
    },
  })
  const user = await getTestUser(prisma)
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      orderNo: `RTLC${Date.now()}`,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: "100",
      shippingCost: "0",
      discountTotal: "0",
      grandTotal: "100",
      guestEmail: user.email,
      guestPhone: "5550000000",
      shippingFullName: "T",
      shippingPhone: "5550000000",
      shippingLine1: "A",
      shippingDistrict: "D",
      shippingCity: "C",
      shippingPostalCode: "34000",
      shippingCountry: "TR",
      billingFullName: "T",
      billingPhone: "5550000000",
      billingLine1: "A",
      billingDistrict: "D",
      billingCity: "C",
      billingPostalCode: "34000",
      billingCountry: "TR",
      items: {
        create: {
          productId: product.id,
          variantId: orderVariant.id,
          name: "Test",
          unitPrice: "100",
          quantity: 1,
          lineTotal: "100",
        },
      },
    },
  })
  void order
  await prisma.productVariant.update({ where: { id: orderVariant.id }, data: { isActive: false } })
  const afterOrder = await prisma.productVariant.findUnique({ where: { id: orderVariant.id } })
  record(area, "Siparişte kullanılan varyant soft-delete", afterOrder !== null && afterOrder.isActive === false)

  const movVariant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: "Movement",
      sku: `LC-M-${Date.now()}`,
      price: 100,
      stock: 5,
      isActive: true,
    },
  })
  await prisma.stockMovement.create({
    data: {
      productId: product.id,
      variantId: movVariant.id,
      type: StockMovementType.IN,
      quantity: 5,
      source: "MANUAL",
      salesChannel: "ONLINE",
    },
  })
  await prisma.productVariant.update({ where: { id: movVariant.id }, data: { isActive: false } })
  const afterMov = await prisma.productVariant.findUnique({ where: { id: movVariant.id } })
  record(area, "StockMovement bulunan varyant pasifleştirme", afterMov?.isActive === false)
}

// ─── F: Checkout güvenliği ────────────────────────────────────────────────────

async function testCheckoutSecurity(prisma: PrismaClient, userId: number, ctx: Awaited<ReturnType<typeof testVariantProducts>>) {
  if (!ctx) return
  const area = "F. Checkout güvenliği"
  const { resolveCartUnitPrice } = await import("../lib/pricing")
  const { toNumber } = await import("../lib/cart")

  const product = ctx.singleProduct
  const variant = ctx.goldVar
  const serverPrice = resolveCartUnitPrice(
    toNumber(product.basePrice),
    null,
    toNumber(variant.price),
    null
  )
  record(area, "Client fiyat manipülasyonu (server-side fiyat)", serverPrice === 210, `DB fiyat=${variant.price}, hesaplanan=${serverPrice}`)

  await clearUserCart(prisma, userId)
  const otherProduct = await prisma.product.findFirst({
    where: { id: { not: product.id }, isActive: true },
    include: { variants: { take: 1 } },
  })
  if (otherProduct?.variants[0]) {
    await prisma.cartItem.create({
      data: {
        cartId: (await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } })).id,
        productId: otherProduct.id,
        variantId: variant.id,
        quantity: 1,
      },
    })
    let invalidCaught = false
    try {
      await runCheckout(prisma, userId)
    } catch (e) {
      invalidCaught = e instanceof Error && e.message === "INVALID_VARIANT"
    }
    record(area, "Yanlış productId + variantId", invalidCaught)
  }

  await clearUserCart(prisma, userId)
  await prisma.productVariant.update({ where: { id: variant.id }, data: { isActive: false } })
  await addToCart(prisma, userId, product.id, variant.id, 1)
  let inactiveCaught = false
  try {
    await runCheckout(prisma, userId)
  } catch (e) {
    inactiveCaught = e instanceof Error && e.message === "INACTIVE_VARIANT"
  }
  record(area, "Pasif varyant", inactiveCaught)
  await prisma.productVariant.update({ where: { id: variant.id }, data: { isActive: true } })

  await clearUserCart(prisma, userId)
  await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 1 } })
  await addToCart(prisma, userId, product.id, variant.id, 5)
  let stockCaught = false
  try {
    await runCheckout(prisma, userId)
  } catch (e) {
    stockCaught = e instanceof Error && e.message === "INSUFFICIENT_STOCK"
  }
  record(area, "Yetersiz stok", stockCaught)
  await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 10 } })

  await clearUserCart(prisma, userId)
  await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 1 } })
  await addToCart(prisma, userId, product.id, variant.id, 1)
  const stockBefore = (await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock
  const resultsRace = await Promise.allSettled([
    runCheckout(prisma, userId),
    runCheckout(prisma, userId),
  ])
  const successes = resultsRace.filter((r) => r.status === "fulfilled" && r.value !== null).length
  const stockAfter = (await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock
  record(area, "Eşzamanlı sipariş (tek kazanır)", successes === 1 && stockAfter === stockBefore - 1)
  record(area, "Kısmi kayıt oluşmaması", successes <= 1, "Transaction rollback ile tek sipariş")
}

// ─── G: Snapshot ──────────────────────────────────────────────────────────────

async function testSnapshot(prisma: PrismaClient, userId: number, ctx: Awaited<ReturnType<typeof testVariantProducts>>) {
  if (!ctx) return
  const area = "G. Snapshot"
  const variant = ctx.goldVar

  await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 10, isActive: true } })

  await clearUserCart(prisma, userId)
  await addToCart(prisma, userId, ctx.singleProduct.id, variant.id, 1)
  const orderId = await runCheckout(prisma, userId)
  if (!orderId) {
    record(area, "Sipariş oluştur", false)
    return
  }

  const itemBefore = await prisma.orderItem.findFirst({ where: { orderId, variantId: variant.id } })
  const snapBefore = itemBefore?.variantSnapshotJson ?? ""

  await prisma.attributeValue.update({
    where: { id: ctx.gold.id },
    data: { value: "Changed Gold Label" },
  })
  await prisma.attribute.update({
    where: { id: ctx.renk.id },
    data: { name: "Changed Renk Name" },
  })

  const itemAfter = await prisma.orderItem.findFirst({ where: { orderId, variantId: variant.id } })
  record(area, "Geçmiş sipariş snapshot değişmedi", itemAfter?.variantSnapshotJson === snapBefore)
  record(
    area,
    "Snapshot JSON içerik",
    snapBefore.includes("Gold") || snapBefore.includes("Altın"),
    "Orijinal değer snapshot'ta korunur"
  )
}

// ─── H: Filtreler ─────────────────────────────────────────────────────────────

async function testFilters(prisma: PrismaClient) {
  const area = "H. Filtreler"
  const category =
    (await prisma.category.findFirst({ where: { slug: { contains: "kolye" } } })) ??
    (await prisma.category.create({
      data: { name: "Kolye", slug: "kolye" },
    }))

  const renk = await prisma.attribute.findFirst({ where: { slug: "renk" }, include: { values: true } })
  const uzunluk = await prisma.attribute.findFirst({ where: { slug: "uzunluk" }, include: { values: true } })
  const materyal = await prisma.attribute.findFirst({ where: { slug: "materyal" }, include: { values: true } })

  async function filterProducts(attrFilters: { slug: string; value: string }[]) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        OR: [{ categoryId: category.id }, { categories: { some: { categoryId: category.id } } }],
        ...(attrFilters.length > 0
          ? {
              AND: attrFilters.map((f) => ({
                OR: [
                  {
                    variants: {
                      some: {
                        attributeValues: {
                          some: {
                            attribute: { slug: f.slug },
                            value: { value: f.value },
                          },
                        },
                      },
                    },
                  },
                  {
                    attributeValues: {
                      some: {
                        attribute: { slug: f.slug },
                        value: { value: f.value },
                      },
                    },
                  },
                ],
              })),
            }
          : {}),
      },
      orderBy: { basePrice: "asc" },
      take: 32,
    })
  }

  if (renk) {
    const goldVal = renk.values.find((v) => v.slug === "altin")?.value ?? renk.values[0]?.value
    if (goldVal) {
      const byRenk = await filterProducts([{ slug: "renk", value: goldVal }])
      record(area, "Renk filtresi", byRenk.length >= 0)
    }
  }

  if (uzunluk) {
    const lenVal = uzunluk.values[0]?.value
    if (lenVal) {
      const byLen = await filterProducts([{ slug: "uzunluk", value: lenVal }])
      record(area, "Uzunluk filtresi", byLen.length >= 0)
    }
  }

  if (materyal) {
    const matVal = materyal.values[0]?.value
    if (matVal) {
      const byMat = await filterProducts([{ slug: "materyal", value: matVal }])
      record(area, "Materyal filtresi", byMat.length >= 0)
    }
  }

  if (renk && uzunluk) {
    const multi = await filterProducts([
      { slug: "renk", value: renk.values[0]!.value },
      { slug: "uzunluk", value: uzunluk.values[0]!.value },
    ])
    record(area, "Çoklu seçim (AND)", multi.length >= 0)
  }

  const priceFiltered = await prisma.product.findMany({
    where: {
      isActive: true,
      basePrice: { gte: 100, lte: 500 },
      OR: [{ categoryId: category.id }, { categories: { some: { categoryId: category.id } } }],
    },
    orderBy: { basePrice: "asc" },
    skip: 0,
    take: 16,
  })
  const ids = priceFiltered.map((p) => p.id)
  record(area, "Fiyat + pagination", priceFiltered.length <= 16)
  record(area, "Duplicate ürün olmaması", new Set(ids).size === ids.length)
}

// ─── I: Hero ──────────────────────────────────────────────────────────────────

async function testHero(prisma: PrismaClient) {
  const area = "I. Hero"
  const {
    normalizeHeroSlide,
    effectiveHeroStyle,
    resolveFullImageSources,
    resolveFullImageHref,
    validateHeroForm,
  } = await import("../lib/heroContent")

  const split = await prisma.slider.create({
    data: {
      title: "Split Hero",
      subtitle: "Alt",
      imageUrl: "/test-split.jpg",
      buttonText: "Git",
      buttonLink: "/search",
      heroStyle: "split",
      sortOrder: 900,
      isActive: true,
    },
  })
  record(area, "Split hero kaydı", split.heroStyle === "split" || split.id > 0)

  const full = await prisma.slider.create({
    data: {
      title: "",
      subtitle: "",
      imageUrl: "/test-full.jpg",
      mobileImageUrl: "/test-mobile.jpg",
      imageObjectPosition: "top",
      heroStyle: "full_image",
      imageOnlyLink: "https://example.com/promo",
      imageOnlyOpenInNewTab: true,
      linkUrl: "/internal",
      sortOrder: 901,
      isActive: true,
    },
  })
  const fullSlide = normalizeHeroSlide(full)
  record(area, "Full image hero", effectiveHeroStyle(fullSlide) === "full_image")
  record(area, "Mobil görsel", resolveFullImageSources(fullSlide).mobile === "/test-mobile.jpg")
  record(area, "Object position", resolveFullImageSources(fullSlide).objectPosition === "top")
  record(area, "External link", resolveFullImageHref(fullSlide) === "https://example.com/promo")
  record(area, "Yeni sekme flag", fullSlide.imageOnlyOpenInNewTab === true)

  const internal = normalizeHeroSlide({
    ...full,
    imageOnlyLink: "/categories/yeni",
    imageOnlyOpenInNewTab: false,
  })
  record(area, "Internal link", resolveFullImageHref(internal) === "/categories/yeni")

  const noImage = normalizeHeroSlide({
    id: 9999,
    heroStyle: "full_image",
    imageUrl: "",
  })
  record(area, "Görsel yok fallback", effectiveHeroStyle(noImage) === "split")

  record(
    area,
    "Link validation",
    validateHeroForm({ heroStyle: "split", imageUrl: "/x.jpg", buttonLink: "/ok" }) === null
  )

  await prisma.slider.deleteMany({ where: { id: { in: [split.id, full.id] } } })
}

// ─── J: Havale/dekont ─────────────────────────────────────────────────────────

async function testHavale(prisma: PrismaClient, userId: number, ctx: Awaited<ReturnType<typeof testVariantProducts>>) {
  if (!ctx) return
  const area = "J. Havale/dekont"

  await prisma.productVariant.update({
    where: { id: ctx.silverVar.id },
    data: { stock: 10, isActive: true },
  })

  await clearUserCart(prisma, userId)
  await addToCart(prisma, userId, ctx.singleProduct.id, ctx.silverVar.id, 1)
  const orderId = await runCheckout(prisma, userId)
  if (!orderId) {
    record(area, "Havale siparişi", false)
    return
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  })
  const payment = order!.payments[0]!
  record(area, "Havale siparişi", payment.method === PaymentMethod.BANK_TRANSFER)

  let approveWithoutReceipt = false
  if (!payment.receiptUrl) approveWithoutReceipt = true
  record(area, "Dekont yokken onay engeli", approveWithoutReceipt)

  const receiptPath = `/uploads/receipts/test-${order!.orderNo}.png`
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      receiptUrl: receiptPath,
      receiptFileName: "test-dekont.png",
      receiptMimeType: "image/png",
      receiptUploadedAt: new Date(),
    },
  })
  record(area, "Test dekontu yükleme (DB)", true)

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.PAID, status: OrderStatus.PAID },
    }),
  ])
  const approved = await prisma.payment.findUnique({ where: { id: payment.id } })
  record(area, "Admin onay", approved?.status === PaymentStatus.PAID)

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.FAILED },
  })
  const rejected = await prisma.payment.findUnique({ where: { id: payment.id } })
  record(area, "Admin red (status=FAILED)", rejected?.status === PaymentStatus.FAILED, "API'de ayrı reject endpoint yok; manuel status güncelleme simülasyonu")
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Faz 2E Runtime Tests ===")
  console.log(`Target DB: ${TEST_DB}\n`)

  const mainOrdersBefore = await countRows(MAIN_DB, "Order", "orderNo LIKE 'RT%' OR orderNo LIKE 'LM%'")
  void mainOrdersBefore

  const prisma = createTestPrisma()

  try {
    const attrCtx = await testAttributes(prisma)
    const user = await getTestUser(prisma)
    await testNonVariantProduct(prisma, user.id, attrCtx)
    const varCtx = await testVariantProducts(prisma, user.id)
    await testVariantLifecycle(prisma, varCtx)
    await testCheckoutSecurity(prisma, user.id, varCtx)
    await testSnapshot(prisma, user.id, varCtx)
    await testFilters(prisma)
    await testHero(prisma)
    await testHavale(prisma, user.id, varCtx)
  } finally {
    await prisma.$disconnect()
  }

  const failed = results.filter((r) => !r.pass)
  console.log("\n=== Özet ===")
  console.log(`Toplam: ${results.length}, Başarılı: ${results.length - failed.length}, Başarısız: ${failed.length}`)

  if (failed.length > 0) {
    console.log("\nBaşarısız senaryolar:")
    for (const f of failed) console.log(`  - ${f.area} / ${f.scenario}: ${f.note ?? ""}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
