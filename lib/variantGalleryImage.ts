export type GalleryImage = { src: string; alt: string }

export function resolveVariantGalleryIndex(
  images: GalleryImage[],
  variantImageUrl: string | null | undefined
): { index: number; virtualImage?: GalleryImage } {
  if (!variantImageUrl?.trim()) {
    return { index: -1 }
  }
  const normalized = variantImageUrl.trim()
  const idx = images.findIndex(
    (img) => img.src === normalized || img.src.endsWith(normalized) || normalized.endsWith(img.src)
  )
  if (idx >= 0) return { index: idx }
  return {
    index: -1,
    virtualImage: { src: normalized, alt: "Varyant görseli" },
  }
}

export function galleryImagesWithVariant(
  images: GalleryImage[],
  variantImageUrl: string | null | undefined
): GalleryImage[] {
  const { index, virtualImage } = resolveVariantGalleryIndex(images, variantImageUrl)
  if (index >= 0) return images
  if (virtualImage) return [virtualImage, ...images]
  return images
}

export function preferredGalleryIndex(
  images: GalleryImage[],
  variantImageUrl: string | null | undefined,
  currentIndex: number
): number {
  const { index } = resolveVariantGalleryIndex(images, variantImageUrl)
  if (index >= 0) return index
  if (!variantImageUrl?.trim()) return currentIndex
  return 0
}
