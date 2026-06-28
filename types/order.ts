export type OrderItemSnapshot = {
  name: string
  slug: string
  type: string
  value: string
  colorHex?: string | null
}

export type PublicOrderItem = {
  id?: number
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  variantSku?: string | null
  sku?: string | null
  variantSnapshotJson?: string | null
  product?: {
    id: number
    slug?: string
    name?: string
    images?: { url: string }[]
  } | null
}

export type PublicOrderPayment = {
  method?: string | null
  status?: string | null
  receiptUrl?: string | null
}

export type PublicOrder = {
  message?: string
  orderNo: string
  status: string
  paymentStatus: string
  grandTotal: number
  subtotal?: number
  shippingCost?: number
  discountTotal?: number
  shippingFullName?: string | null
  shippingPhone?: string | null
  shippingLine1?: string | null
  shippingLine2?: string | null
  shippingCity?: string | null
  shippingDistrict?: string | null
  shippingPostalCode?: string | null
  shippingCountry?: string | null
  note?: string | null
  createdAt: string
  items: PublicOrderItem[]
  payment?: PublicOrderPayment | null
  payments?: PublicOrderPayment[]
  shipment?: {
    trackingNo?: string | null
    cargoCompany?: string | null
    shippedAt?: string | null
    deliveredAt?: string | null
  } | null
}
