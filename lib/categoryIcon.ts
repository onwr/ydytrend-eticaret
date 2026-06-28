/** Kategori adı/slug'ına göre ikon anahtarı — yalnızca görsel fallback */

export type CategoryIconKey =
  | "jewelry"
  | "earring"
  | "necklace"
  | "bracelet"
  | "ring"
  | "bag"
  | "hat"
  | "accessory"
  | "default"

export function getCategoryIconKey(name: string, slug: string): CategoryIconKey {
  const text = `${name} ${slug}`.toLowerCase()

  if (/küpe|kupe|earring/.test(text)) return "earring"
  if (/kolye|necklace/.test(text)) return "necklace"
  if (/bileklik|bracelet/.test(text)) return "bracelet"
  if (/yüzük|yuzuk|ring/.test(text)) return "ring"
  if (/takı|taki|jewelry/.test(text)) return "jewelry"
  if (/çanta|canta|bag|purse/.test(text)) return "bag"
  if (/şapka|sapka|hat|bere/.test(text)) return "hat"
  if (/aksesuar|accessory/.test(text)) return "accessory"

  return "default"
}
