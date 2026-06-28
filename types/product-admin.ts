import type { CategoryTreeNode } from "@/types/category"

export type RawAttrValue = { attributeId: unknown; valueId: unknown }

export type RawProductImage = string | { url?: string }

export type RawProductVariant = {
  id?: number
  name?: string
  sku?: string
  price?: unknown
  compareAtPrice?: unknown
  stock?: unknown
  lowStockThreshold?: unknown
  imageUrl?: string | null
  attributeValues?: RawAttrValue[]
}

export type ProductCategoryRoot = CategoryTreeNode
