import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  formatPriceValue,
  formatPriceWithSymbol,
  resolveProductCardPrice,
} from "../../lib/storefront/formatPrice"
import {
  isValidColorHex,
  validateColorHexForAttribute,
} from "../../lib/storefront/colorHexValidation"
import {
  buildAttributeFilterQuery,
  mergeSearchParams,
  parseAttributeFilters,
} from "../../lib/storefront/filterQuery"
import { validateBankTransferReject } from "../../lib/storefront/paymentReject"
import { PaymentMethod, PaymentStatus, OrderStatus } from "../../generated/prisma/client"

describe("storefront formatPrice", () => {
  it("formats Turkish locale prices", () => {
    assert.equal(formatPriceValue(349.9), "349,90")
    assert.match(formatPriceWithSymbol(100), /^₺/)
  })

  it("resolveProductCardPrice detects discount", () => {
    const p = resolveProductCardPrice(500, 399)
    assert.equal(p.hasDiscount, true)
    assert.equal(p.current, "399,00")
    assert.equal(p.old, "500,00")
    assert.equal(p.discountPct, 20)
  })
})

describe("colorHex validation", () => {
  it("accepts #RGB #RRGGBB #RRGGBBAA", () => {
    assert.equal(isValidColorHex("#fff"), true)
    assert.equal(isValidColorHex("#FFFFFF"), true)
    assert.equal(isValidColorHex("#FFFFFF80"), true)
    assert.equal(isValidColorHex("red"), false)
  })

  it("COLOR attribute requires valid hex", () => {
    const ok = validateColorHexForAttribute("COLOR", "#C9A84C")
    assert.equal(ok.ok, true)
    const bad = validateColorHexForAttribute("COLOR", "invalid")
    assert.equal(bad.ok, false)
    const nonColor = validateColorHexForAttribute("SELECT", null)
    assert.equal(nonColor.ok, true)
  })
})

describe("filter query builder", () => {
  it("parses and builds attribute filter query", () => {
    const filters = parseAttributeFilters("renk:Gold,uzunluk:40 cm")
    assert.equal(filters.length, 2)
    assert.equal(buildAttributeFilterQuery(filters), "renk:Gold,uzunluk:40%20cm")
  })

  it("mergeSearchParams resets page on filter change", () => {
    const base = new URLSearchParams("page=3&sort=newest")
    const next = mergeSearchParams(base, { attrs: "renk:Gold" })
    assert.equal(next.get("page"), null)
    assert.equal(next.get("attrs"), "renk:Gold")
    assert.equal(next.get("sort"), "newest")
  })
})

describe("bank transfer reject", () => {
  it("rejects invalid transitions", () => {
    const r = validateBankTransferReject({
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PAID,
      receiptUrl: "/r.png",
      orderStatus: OrderStatus.PAID,
    })
    assert.equal(r.ok, false)
  })

  it("allows reject when receipt exists and pending", () => {
    const r = validateBankTransferReject({
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PENDING,
      receiptUrl: "/r.png",
      orderStatus: OrderStatus.PENDING,
    })
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.nextPaymentStatus, PaymentStatus.FAILED)
      assert.equal(r.nextOrderStatus, OrderStatus.CANCELLED)
    }
  })
})
