/** Varyant görsel URL doğrulama — yalnızca http/https veya site içi yol. */
export function validateVariantImageUrl(
  raw: string | null | undefined
): { ok: true; url: string | null } | { ok: false; message: string } {
  const trimmed = raw?.trim()
  if (!trimmed) return { ok: true, url: null }

  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return { ok: false, message: "Geçersiz görsel URL'si." }
  }

  if (trimmed.startsWith("/")) {
    if (trimmed.includes("..")) {
      return { ok: false, message: "Geçersiz görsel yolu." }
    }
    return { ok: true, url: trimmed }
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, message: "Görsel URL'si yalnızca http veya https olabilir." }
    }
    return { ok: true, url: trimmed }
  } catch {
    return { ok: false, message: "Geçersiz görsel URL'si." }
  }
}
