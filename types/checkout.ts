import type { CartLine, CartSummary } from "@/lib/cart"
import type { TurkeyLocation } from "@/lib/turkiyeLocations"

export type CheckoutCart = {
  lines: CartLine[]
  summary: CartSummary
  settings?: { threshold: number; cost: number }
}

export type SavedAddress = {
  id: number
  title?: string
  fullName: string
  city: string
  district: string
  line1: string
  line2?: string | null
}

export type ActiveCoupon = {
  code: string
  discount?: number
  discountAmount?: number
  discountType?: string
}

export type SelectOption = Pick<TurkeyLocation, "id" | "name">
