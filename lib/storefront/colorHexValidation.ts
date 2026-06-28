/** COLOR attribute için geçerli hex formatları: #RGB, #RRGGBB, #RRGGBBAA */
const COLOR_HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/

export function isValidColorHex(value: string | null | undefined): boolean {
  if (!value?.trim()) return true
  return COLOR_HEX_RE.test(value.trim())
}

export function normalizeColorHex(value: string | null | undefined): string | null {
  const v = value?.trim()
  if (!v) return null
  if (!COLOR_HEX_RE.test(v)) {
    throw new Error("Geçersiz renk kodu. #RGB, #RRGGBB veya #RRGGBBAA formatında olmalıdır.")
  }
  return v
}

export function validateColorHexForAttribute(
  attributeType: string,
  colorHex: string | null | undefined
): { ok: true; colorHex: string | null } | { ok: false; message: string } {
  const trimmed = colorHex?.trim() ?? ""
  if (attributeType === "COLOR") {
    if (!trimmed) {
      return { ok: false, message: "Renk tipi özellik için colorHex zorunludur." }
    }
    if (!isValidColorHex(trimmed)) {
      return {
        ok: false,
        message: "Geçersiz renk kodu. #RGB, #RRGGBB veya #RRGGBBAA formatında olmalıdır.",
      }
    }
    return { ok: true, colorHex: trimmed }
  }
  if (trimmed) {
    return { ok: false, message: "colorHex yalnızca COLOR tipi özellikler için kullanılabilir." }
  }
  return { ok: true, colorHex: null }
}
