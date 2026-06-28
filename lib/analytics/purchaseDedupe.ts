const STORAGE_KEY = "ydy_analytics_purchases"

function getSessionStorage(): Storage | null {
  if (typeof globalThis === "undefined") return null
  const g = globalThis as { sessionStorage?: Storage; window?: { sessionStorage?: Storage } }
  return g.sessionStorage ?? g.window?.sessionStorage ?? null
}

function readSet(): Set<string> {
  const storage = getSessionStorage()
  if (!storage) return new Set()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function writeSet(set: Set<string>) {
  const storage = getSessionStorage()
  if (!storage) return
  storage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-50)))
}

/** Purchase event orderId başına bir kez. */
export function shouldSendPurchaseEvent(orderId: string): boolean {
  const set = readSet()
  if (set.has(orderId)) return false
  set.add(orderId)
  writeSet(set)
  return true
}

export function resetPurchaseDedupeForTests(): void {
  getSessionStorage()?.removeItem(STORAGE_KEY)
}
