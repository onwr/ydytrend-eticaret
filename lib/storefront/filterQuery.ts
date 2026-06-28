export type AttributeFilter = { slug: string; value: string }

export function parseAttributeFilters(raw: string | null | undefined): AttributeFilter[] {
  if (!raw?.trim()) return []
  const filters: AttributeFilter[] = []
  for (const pair of raw.split(",")) {
    const idx = pair.indexOf(":")
    if (idx > 0) {
      filters.push({
        slug: pair.slice(0, idx).trim(),
        value: pair.slice(idx + 1).trim(),
      })
    }
  }
  return filters
}

export function buildAttributeFilterQuery(filters: AttributeFilter[]): string {
  return filters
    .filter((f) => f.slug && f.value)
    .map((f) => `${encodeURIComponent(f.slug)}:${encodeURIComponent(f.value)}`)
    .join(",")
}

export function mergeSearchParams(
  base: URLSearchParams,
  updates: Record<string, string | null | undefined>
): URLSearchParams {
  const next = new URLSearchParams(base.toString())
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key)
    } else {
      next.set(key, value)
    }
  }
  if (Object.keys(updates).some((k) => k !== "page")) {
    next.delete("page")
  }
  return next
}
