/** GET /api/categories — children include alanı */
export type CategoryTreeChild = {
  id: number
  name: string
  slug: string
  parentId: number | null
}

/** GET /api/categories — kök veya düz liste satırı */
export type CategoryTreeNode = {
  id: number
  name: string
  slug: string
  parentId: number | null
  children?: CategoryTreeChild[]
  parent?: { id: number; name: string; slug: string } | null
  _count?: {
    products: number
    subProducts?: number
    children?: number
    productLinks?: number
  }
}

export function isCategoryTreeNode(value: unknown): value is CategoryTreeNode {
  if (!value || typeof value !== "object") return false
  const row = value as Record<string, unknown>
  return (
    typeof row.id === "number" &&
    typeof row.name === "string" &&
    typeof row.slug === "string"
  )
}

export function parseCategoryTreeItems(payload: unknown): CategoryTreeNode[] {
  if (!payload || typeof payload !== "object") return []
  const items = (payload as { items?: unknown }).items
  if (!Array.isArray(items)) return []
  return items.filter(isCategoryTreeNode)
}

export function rootCategories(items: CategoryTreeNode[]): CategoryTreeNode[] {
  return items.filter((c) => c.parentId === null)
}
