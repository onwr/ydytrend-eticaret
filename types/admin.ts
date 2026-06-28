export type AdminDailyRevenuePoint = {
  date: string
  total: number
}

export type AdminRecentOrder = {
  id: number
  orderNo: string
  grandTotal: number
  status: string
  customer: string
  itemCount: number
  productsPreview?: string | null
}

export type AdminLowStockItem = {
  productId: number
  variantId: number
  name: string
  stock: number
}

export type AdminStats = {
  todayRevenue: number
  yesterdayRevenue: number
  monthRevenue: number
  lastMonthRevenue: number
  todayRetailRevenue: number
  yesterdayRetailRevenue: number
  monthRetailRevenue: number
  lastMonthRetailRevenue: number
  todayCombinedRevenue: number
  yesterdayCombinedRevenue: number
  monthCombinedRevenue: number
  lastMonthCombinedRevenue: number
  totalOrders: number
  previousOrders: number
  averageOrderValue: number
  previousAvgOrder: number
  pendingOrders: number
  previousPending: number
  newCustomers: number
  previousCustomers: number
  dailyRevenue: AdminDailyRevenuePoint[]
  recentOrders: AdminRecentOrder[]
  topProducts: { productId: number; name: string; sales: number; revenue: number }[]
  lowStock: AdminLowStockItem[]
  processingOrders: number
  shippedOrders: number
  completedOrders: number
  refundedOrders: number
  conversionRate: number
  previousConversion: number
  satisfactionRate: number
  totalReviews: number
  activeCoupons: number
  couponRevenue: number
  returnRate: number
  totalReturns: number
  afterSalesSummary?: {
    pendingReturns: number
    pendingExchanges: number
    underReview: number
    staleOver24h: number
  }
}

export type AdminOrderListItem = {
  orderNo: string
  shippingFullName: string
  guestEmail?: string | null
  createdAt: string
  grandTotal: number
  paymentStatus: string
  status: string
  user?: { email?: string | null } | null
}

export type AdminOrderPayment = {
  method?: string | null
  status?: string | null
  receiptUrl?: string | null
  receiptFileName?: string | null
  receiptMimeType?: string | null
  receiptUploadedAt?: string | null
}

export type AdminOrderItem = {
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
    images?: { url: string }[]
  } | null
}

export type AdminOrderDetail = {
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
  shippingAddress?: string | null
  shippingLine1?: string | null
  shippingLine2?: string | null
  shippingCity?: string | null
  shippingDistrict?: string | null
  shippingPostalCode?: string | null
  shippingCountry?: string | null
  guestEmail?: string | null
  note?: string | null
  createdAt: string
  items?: AdminOrderItem[]
  user?: { email?: string | null; name?: string | null } | null
  payment?: AdminOrderPayment | null
  payments?: AdminOrderPayment[]
  shipment?: {
    trackingNo?: string | null
    cargoCompany?: string | null
    trackingUrl?: string | null
    estimatedDeliveryDate?: string | null
    shippedAt?: string | null
    deliveredAt?: string | null
  } | null
}

export type AdminCustomerAddress = {
  id: number
  title: string
  fullName: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  district: string
  isDefault: boolean
}

export type AdminCustomerOrder = {
  id: number
  orderNo: string
  createdAt: string
  grandTotal: number
  status: string
  paymentStatus: string
}

export type AdminCustomerEditForm = {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
}

export type AdminBarcodeProduct = {
  id: number
  name: string
  sku?: string | null
  barcode?: string | null
  basePrice?: number | string | null
  variants?: {
    id: number
    name: string
    sku?: string | null
    barcode?: string | null
    price?: number | string | null
  }[]
}
