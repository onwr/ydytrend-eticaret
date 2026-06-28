export const FAVORITES_UPDATED_EVENT = "little-moms-favorites-updated"

export function dispatchFavoritesUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT))
}
