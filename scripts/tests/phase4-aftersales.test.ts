import test from "node:test"
import assert from "node:assert/strict"
import {
  canTransitionOrderStatus,
  validateOrderStatusTransition,
  canCustomerCancelOrder,
} from "@/lib/orderStatusTransitions"
import { OrderStatus } from "@/generated/prisma/client"
import { validateTrackingUrl } from "@/lib/trackingUrlValidation"
import {
  computeDiscountPercentage,
  computeProductDiscountFromPrices,
} from "@/lib/discountPercentage"
import {
  resolveVariantGalleryIndex,
  preferredGalleryIndex,
} from "@/lib/variantGalleryImage"
import { validateReturnItemQuantity } from "@/lib/returnEligibility"
import { isWithinReturnWindow } from "@/lib/returnPolicySettings"
import {
  canCustomerCancelReturn,
  canTransitionReturnStatus,
  isTerminalReturnStatus,
  validateReturnAdminAction,
} from "@/lib/returnStatusTransitions"
import { validateVariantImageUrl } from "@/lib/variantImageUrlValidation"
import { validateReturnAttachment } from "@/lib/returnUpload"

test("order status transitions", () => {
  assert.equal(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.CANCELLED), true)
  assert.equal(canTransitionOrderStatus(OrderStatus.DELIVERED, OrderStatus.PROCESSING), false)
  assert.equal(canCustomerCancelOrder(OrderStatus.SHIPPED), false)
  const bad = validateOrderStatusTransition(OrderStatus.CANCELLED, OrderStatus.PAID)
  assert.equal(bad.ok, false)
})

test("tracking URL validation", () => {
  assert.equal(validateTrackingUrl("javascript:alert(1)").ok, false)
  assert.equal(validateTrackingUrl("https://kargo.example/track/1").ok, true)
})

test("discount percentage", () => {
  assert.equal(computeDiscountPercentage(100, 80), 20)
  assert.equal(computeDiscountPercentage(0, 80), 0)
  assert.equal(computeProductDiscountFromPrices(80, 100), 20)
})

test("variant gallery index", () => {
  const images = [{ src: "/a.jpg", alt: "a" }, { src: "/b.jpg", alt: "b" }]
  assert.equal(resolveVariantGalleryIndex(images, "/b.jpg").index, 1)
  assert.equal(resolveVariantGalleryIndex(images, "/c.jpg").index, -1)
  assert.equal(preferredGalleryIndex(images, "/b.jpg", 0), 1)
  assert.equal(preferredGalleryIndex(images, null, 1), 1)
})

test("return item quantity", () => {
  const ok = validateReturnItemQuantity({ id: 1, quantity: 2 }, 1, 0)
  assert.equal(ok.ok, true)
  const bad = validateReturnItemQuantity({ id: 1, quantity: 2 }, 3, 0)
  assert.equal(bad.ok, false)
})

test("return window", () => {
  const delivered = new Date("2026-06-01T12:00:00Z")
  assert.equal(isWithinReturnWindow(delivered, 14, new Date("2026-06-10T12:00:00Z")), true)
  assert.equal(isWithinReturnWindow(delivered, 14, new Date("2026-06-20T12:00:00Z")), false)
})

test("return status transitions", () => {
  assert.equal(canTransitionReturnStatus("PENDING", "UNDER_REVIEW"), true)
  assert.equal(canTransitionReturnStatus("COMPLETED", "PENDING"), false)
  assert.equal(isTerminalReturnStatus("REJECTED"), true)
  assert.equal(canCustomerCancelReturn("PENDING"), true)
  assert.equal(canCustomerCancelReturn("WAITING_FOR_PRODUCT"), false)
  const ok = validateReturnAdminAction("PENDING", "review")
  assert.equal(ok.ok, true)
  if (ok.ok) assert.equal(ok.nextStatus, "UNDER_REVIEW")
})

test("variant image URL validation", () => {
  assert.equal(validateVariantImageUrl("javascript:alert(1)").ok, false)
  assert.equal(validateVariantImageUrl("https://cdn.example/v.jpg").ok, true)
  assert.equal(validateVariantImageUrl("/uploads/a.jpg").ok, true)
  assert.equal(validateVariantImageUrl("").ok, true)
})

test("return upload validation", () => {
  assert.equal(validateReturnAttachment("image/jpeg", 1000, "photo.jpg").ok, true)
  assert.equal(validateReturnAttachment("image/svg+xml", 1000, "x.svg").ok, false)
  assert.equal(validateReturnAttachment("image/png", 6 * 1024 * 1024, "big.png").ok, false)
  const bad = validateReturnAttachment("image/png", 100, "../etc/passwd")
  assert.equal(bad.ok, false)
})
