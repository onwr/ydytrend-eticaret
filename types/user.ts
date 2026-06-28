import type { ReactNode } from "react"

export type UserAddress = {
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

export type UserOrderItem = {
  id?: number
  name: string
  quantity: number
  imageUrl?: string | null
  product?: {
    id: number
    slug?: string
    name?: string
    images?: { url: string }[]
  } | null
}

export type UserOrder = {
  id: number
  orderNo: string
  createdAt: string
  grandTotal: number
  status: string
  items?: UserOrderItem[]
}

export type ProfileUser = {
  id: number
  name: string
  email: string
  phone?: string | null
  addresses?: UserAddress[]
  orders?: UserOrder[]
}

export type FavoriteItem = {
  id: number
  productId?: number
  product: {
    id: number
    slug: string
    name: string
    basePrice: number
    compareAtPrice?: number | null
    images?: { url: string }[]
  }
}

export type ProfileInputProps = {
  label: string
  value: string
  onChange?: (value: string) => void
  icon: ReactNode
  type?: string
  disabled?: boolean
}
