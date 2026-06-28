/**
 * Faz 4B runtime doğrulama — yalnızca ydytrend_runtime_test üzerinde çalışır.
 * Kullanım: npx tsx scripts/run-phase4b-runtime-tests.ts
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import {
  OrderStatus,
  PrismaClient,
  ReturnItemCondition,
  ReturnRequestType,
  StockMovementType,
} from "../generated/prisma/client"
import "dotenv/config"
import {
  canCustomerCancelReturn,
  canTransitionReturnStatus,
  validateReturnAdminAction,
} from "../lib/returnStatusTransitions"
import { validateTrackingUrl } from "../lib/trackingUrlValidation"
import { validateReturnAttachment } from "../lib/returnUpload"
import { processReturnStockOnComplete } from "../lib/returnStockProcess"
import { generateReturnRequestNumber } from "../lib/returnRequestNumber"

const TEST_DB = "ydytrend_runtime_test"

type ScenarioResult = { area: string; scenario: string; pass: boolean; note?: string }
const results: ScenarioResult[] = []

function record(area: string, scenario: string, pass: boolean, note?: string) {
  results.push({ area, scenario, pass, note })
  console.log(`  [${pass ? "PASS" : "FAIL"}] ${area} / ${scenario}${note ? ` — ${note}` : ""}`)
}

function buildDbUrl(dbName: string): string {
  const base = process.env.DATABASE_URL?.trim()
  if (!base) throw new Error("DATABASE_URL tanımlı değil.")
  return base.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`)
}

function createTestPrisma(): PrismaClient {
  const url = buildDbUrl(TEST_DB)
  const dbName = new URL(url).pathname.replace(/^\//, "").split("?")[0]
  if (dbName !== TEST_DB) throw new Error(`Güvenlik: yalnızca ${TEST_DB}`)
  return new PrismaClient({ adapter: new PrismaMariaDb(url) })
}

async function getTestUser(prisma: PrismaClient) {
  const user = await prisma.user.findUnique({ where: { email: "runtime-test@ydytrend.local" } })
  if (!user) throw new Error("Runtime test kullanıcısı yok.")
  return user
}

async function testTransitions() {
  const area = "Return transition"
  record(area, "PENDING→UNDER_REVIEW", canTransitionReturnStatus("PENDING", "UNDER_REVIEW"))
  record(area, "Terminal COMPLETED block", !canTransitionReturnStatus("COMPLETED", "PENDING"))
  record(area, "Customer cancel PENDING", canCustomerCancelReturn("PENDING"))
  record(area, "Customer cancel WAITING blocked", !canCustomerCancelReturn("WAITING_FOR_PRODUCT"))
  const bad = validateReturnAdminAction("COMPLETED", "complete")
  record(area, "Complete on terminal fails", bad.ok === false)
}

async function testUploadAndTracking() {
  const area = "Upload/Tracking"
  record(area, "Valid JPG", validateReturnAttachment("image/jpeg", 1000, "a.jpg").ok === true)
  record(area, "Reject SVG", validateReturnAttachment("image/svg+xml", 100, "x.svg").ok === false)
  record(area, "Reject oversize", validateReturnAttachment("image/png", 6 * 1024 * 1024, "b.png").ok === false)
  record(area, "Reject javascript URL", validateTrackingUrl("javascript:alert(1)").ok === false)
  record(area, "Accept https tracking", validateTrackingUrl("https://kargo.test/t/1").ok === true)
}

async function testNewsletter(prisma: PrismaClient) {
  const area = "Newsletter"
  const email = `faz4b-${Date.now()}@test.local`
  const sub = await prisma.newsletterSubscriber.create({
    data: { email, status: "ACTIVE", consentAt: new Date() },
  })
  record(area, "Create ACTIVE", sub.status === "ACTIVE")

  let dupBlocked = false
  try {
    await prisma.newsletterSubscriber.create({ data: { email, status: "ACTIVE" } })
  } catch {
    dupBlocked = true
  }
  record(area, "Duplicate email blocked", dupBlocked)

  await prisma.newsletterSubscriber.update({
    where: { id: sub.id },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  })
  const resub = await prisma.newsletterSubscriber.update({
    where: { id: sub.id },
    data: { status: "ACTIVE", unsubscribedAt: null, confirmedAt: new Date() },
  })
  record(area, "Resubscribe UNSUBSCRIBED", resub.status === "ACTIVE")

  await prisma.newsletterSubscriber.delete({ where: { id: sub.id } })
}

async function testReturnStockIdempotency(prisma: PrismaClient) {
  const area = "Return stock"
  const suffix = Date.now().toString(36)
  const user = await getTestUser(prisma)

  const variant = await prisma.productVariant.findFirst({
    where: { isActive: true, stock: { gte: 5 } },
    include: { product: true },
  })
  if (!variant) {
    record(area, "Setup variant", false, "Aktif varyant yok")
    return
  }

  const order = await prisma.order.create({
    data: {
      orderNo: `F4B-${suffix}`,
      userId: user.id,
      status: OrderStatus.DELIVERED,
      paymentStatus: "PAID",
      shippingFullName: "Test",
      shippingPhone: "555",
      shippingLine1: "A",
      shippingCity: "Istanbul",
      shippingDistrict: "Kadikoy",
      shippingPostalCode: "34000",
      shippingCountry: "TR",
      subtotal: 100,
      shippingCost: 0,
      discountTotal: 0,
      grandTotal: 100,
      items: {
        create: {
          productId: variant.productId,
          variantId: variant.id,
          name: variant.product.name,
          unitPrice: 100,
          quantity: 1,
          lineTotal: 100,
        },
      },
      shipment: { create: { deliveredAt: new Date() } },
    },
    include: { items: true },
  })

  const stockBefore = variant.stock
  const requestNumber = await prisma.$transaction(async (tx) => generateReturnRequestNumber(tx))

  const rr = await prisma.returnRequest.create({
    data: {
      requestNumber,
      orderId: order.id,
      userId: user.id,
      type: ReturnRequestType.RETURN,
      status: "PRODUCT_RECEIVED",
      reason: "Test",
      items: {
        create: {
          orderItemId: order.items[0]!.id,
          quantity: 1,
          condition: ReturnItemCondition.SELLABLE,
        },
      },
    },
    include: { items: { include: { orderItem: true } } },
  })

  await prisma.$transaction(async (tx) => {
    await processReturnStockOnComplete(tx, {
      returnRequestId: rr.id,
      orderId: order.id,
      type: ReturnRequestType.RETURN,
      requestNumber,
      stockRestoredAt: null,
      items: rr.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        condition: ReturnItemCondition.SELLABLE,
        requestedVariantId: it.requestedVariantId,
        orderItem: { productId: it.orderItem.productId, variantId: it.orderItem.variantId },
      })),
    })
  })

  const afterFirst = await prisma.productVariant.findUnique({ where: { id: variant.id } })
  record(area, "SELLABLE restore +1", (afterFirst?.stock ?? 0) === stockBefore + 1)

  const movements = await prisma.stockMovement.count({
    where: { orderId: order.id, type: StockMovementType.RETURN },
  })
  record(area, "Stock movement created", movements === 1)

  await prisma.$transaction(async (tx) => {
    const second = await processReturnStockOnComplete(tx, {
      returnRequestId: rr.id,
      orderId: order.id,
      type: ReturnRequestType.RETURN,
      requestNumber,
      stockRestoredAt: new Date(),
      items: [],
    })
    record(area, "Double complete idempotent", second.processed === false)
  })

  const afterSecond = await prisma.productVariant.findUnique({ where: { id: variant.id } })
  record(area, "No double stock add", (afterSecond?.stock ?? 0) === stockBefore + 1)

  await prisma.returnRequestItem.deleteMany({ where: { returnRequestId: rr.id } })
  await prisma.returnRequest.delete({ where: { id: rr.id } })
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
  await prisma.shipment.deleteMany({ where: { orderId: order.id } })
  await prisma.order.delete({ where: { id: order.id } })
}

async function main() {
  console.log(`\n=== Faz 4B Runtime Tests (${TEST_DB}) ===\n`)
  const prisma = createTestPrisma()
  try {
    await testTransitions()
    await testUploadAndTracking()
    await testNewsletter(prisma)
    await testReturnStockIdempotency(prisma)
  } finally {
    await prisma.$disconnect()
  }

  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass).length
  console.log(`\n=== Sonuç: ${passed}/${results.length} PASS, ${failed} FAIL ===\n`)
  if (failed > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
