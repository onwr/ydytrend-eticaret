const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file):/i

export function validateTrackingUrl(raw: string | null | undefined):
  | { ok: true; url: string }
  | { ok: false; message: string } {
  if (!raw?.trim()) {
    return { ok: false, message: "Takip URL'si boş olamaz." }
  }
  const url = raw.trim()
  if (BLOCKED_PROTOCOLS.test(url)) {
    return { ok: false, message: "Geçersiz takip URL protokolü." }
  }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, message: "Yalnızca http/https URL kabul edilir." }
    }
    return { ok: true, url: parsed.toString() }
  } catch {
    return { ok: false, message: "Geçersiz takip URL'si." }
  }
}
