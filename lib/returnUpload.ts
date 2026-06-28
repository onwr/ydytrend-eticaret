const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_SIZE = 5 * 1024 * 1024
export const MAX_RETURN_ATTACHMENTS = 5

export function validateReturnAttachment(
  mimeType: string,
  size: number,
  fileName: string
): { ok: true; safeName: string } | { ok: false; message: string } {
  if (!ALLOWED_MIMES.has(mimeType)) {
    return { ok: false, message: "Yalnızca JPG, PNG veya WebP yüklenebilir." }
  }
  if (size <= 0 || size > MAX_SIZE) {
    return { ok: false, message: "Dosya boyutu en fazla 5 MB olabilir." }
  }
  const base = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120)
  if (!base || base.includes("..")) {
    return { ok: false, message: "Geçersiz dosya adı." }
  }
  return { ok: true, safeName: base }
}
