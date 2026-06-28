/**
 * CDN Storage Service
 * Bu servis, resimleri uzak bir CDN sunucusuna (upload.php) yüklemek için kullanılır.
 */

/** Büyük base64 data URL'lerde regex stack overflow olmaması için index ile ayrıştırır. */
function parseDataUrl(data: string): { mime: string; base64: string } | null {
  if (!data.startsWith("data:")) return null
  const marker = ";base64,"
  const markerIdx = data.indexOf(marker)
  if (markerIdx === -1) return null
  const mime = data.slice(5, markerIdx).trim()
  const base64 = data.slice(markerIdx + marker.length)
  if (!mime || !base64) return null
  return { mime, base64 }
}

export function isDataUrl(value: string): boolean {
  return value.startsWith("data:")
}

/** Data URL ise CDN'e yükler; http(s) yolu ise olduğu gibi döner. */
export async function resolveImageUrl(
  imageUrl: string | undefined,
  folder: string
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const trimmed = imageUrl?.trim()
  if (!trimmed) {
    return { ok: false, message: "Görsel zorunludur." }
  }
  if (!isDataUrl(trimmed)) {
    return { ok: true, url: trimmed }
  }
  const uploaded = await saveFile(trimmed, folder)
  if (!uploaded) {
    return {
      ok: false,
      message:
        "Görsel CDN'e yüklenemedi. .env dosyasında CDN_UPLOAD_URL ve CDN_UPLOAD_TOKEN tanımlı olmalı.",
    }
  }
  return { ok: true, url: uploaded }
}

export async function saveFile(data: string, folder: string = "general"): Promise<string | null> {
  const CDN_UPLOAD_URL = process.env.CDN_UPLOAD_URL
  const CDN_UPLOAD_TOKEN = process.env.CDN_UPLOAD_TOKEN
  const CDN_BASE_URL = process.env.CDN_BASE_URL

  try {
    if (!data) return null

    // Eğer data zaten bir uzak URL ise (http...), direkt döndür
    if (data.startsWith("http") && !data.includes("base64")) {
      return data
    }

    const parsed = parseDataUrl(data)
    if (!parsed) {
      // Base64 data URL değilse ve http de değilse — ham yol veya geçersiz
      return data.startsWith("data:") ? null : data
    }

    const { mime, base64: base64Data } = parsed
    const buffer = Buffer.from(base64Data, "base64")

    const extension = mime.split("/")[1]?.split("+")[0] || "png"
    const fileName = `upload_${Date.now()}.${extension}`

    if (!CDN_UPLOAD_URL) {
      console.error("CDN_UPLOAD_URL eksik!")
      return null
    }

    const formData = new FormData()
    const file = new File([buffer], fileName, { type: mime })

    formData.append("file", file)
    formData.append("token", CDN_UPLOAD_TOKEN || "")
    formData.append("folder", folder)

    const response = await fetch(CDN_UPLOAD_URL, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("CDN upload error status:", response.status, errorText)
      return null
    }

    const result = await response.json()

    if (result.url) {
      let finalUrl = result.url
      if (!finalUrl.startsWith("http")) {
        finalUrl = `${CDN_BASE_URL}${finalUrl.startsWith("/") ? "" : "/"}${finalUrl}`
      }
      return finalUrl
    }

    console.error("CDN response missing URL:", result)
    return null
  } catch (error) {
    console.error("Storage save error:", error)
    return null
  }
}

/**
 * Uzak CDN için silme işlemi (Eğer destekleniyorsa)
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  console.log("Delete requested for:", fileUrl)
}
