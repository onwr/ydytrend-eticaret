export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024

export const RECEIPT_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
])

export function isAllowedReceiptMime(mime: string): boolean {
  return RECEIPT_ALLOWED_MIME.has(mime.toLowerCase())
}

export function receiptExtensionFromMime(mime: string): string {
  switch (mime.toLowerCase()) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "application/pdf":
      return "pdf"
    default:
      return "bin"
  }
}
