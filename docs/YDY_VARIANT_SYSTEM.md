# YDY Trend — Varyant ve Özellik Sistemi

## Veri Modeli

```
Attribute (renk, beden, materyal…)
  └─ AttributeValue (Gold, S, 925 Gümüş…)

Category
  └─ CategoryAttribute  (hangi kategoride hangi özellik var, isVariant/isFilterable/isRequired)

Product
  └─ ProductAttributeValue     (ürün düzeyi, varyant oluşturmayan: materyal, kaplama…)
  └─ ProductVariant
       └─ ProductVariantAttributeValue  (bu varyantın özellik değerleri: Renk=Gold, Beden=M)
       └─ combinationKey  "attrId1:valId1|attrId2:valId2" (sıralı, unique per product)
```

### Geriye Dönük Uyumluluk

Eski varyantlarda `attributesJson` alanı mevcuttur (`{"Renk":"Gold","Beden":"M"}`).
`lib/variantAttributes.ts::normalizeVariantAttributes()` her iki kaynağı aynı tipte döner.
Öncelik sırası: ilişkisel veri → JSON fallback.

---

## Admin Kullanımı

### 1. Attribute Oluşturma
`/admin/attributes` — Özellik ekle, değer ekle, renk picker.

### 2. Kategoriye Özellik Bağlama
`/admin/categories` → Düzenle → Özellikler paneli.
- **Varyant**: Bu özellik varyant boyutu oluşturur (Renk, Beden).
- **Filtre**: Kategori sayfasında filtre olarak görünür.
- **Zorunlu**: Ürün kaydedilirken bu özellik seçilmeli.

### 3. Ürün Oluşturma/Düzenleme
`/admin/products/new` veya `/admin/products/[id]/edit`

**Varyant attribute picker**: Kategoriye bağlı `isVariant=true` özellikler her varyant satırında seçim menüsü olarak gösterilir.

**Kombinasyon üretici (new sayfasında)**:
1. Özellik değerlerini seç (Renk: Gold, Silver; Beden: S, M).
2. "Üret" butonuna tıkla.
3. Sistem cartesian product (Gold/S, Gold/M, Silver/S, Silver/M) oluşturur.
4. Mevcut varyantların SKU, fiyat, stok bilgisi korunur.

**Ürün düzeyi özellikler** (`isVariant=false`): Materyal, Kaplama, Stil gibi özellikler `productAttributeValues` üzerinden kaydedilir.

---

## Kombinasyon Üretimi

```typescript
import { generateVariantCombinations, mergeVariantCombinationsWithExisting } from "@/lib/variantCombinations"

const axes = [
  { attributeId: 1, attributeName: "Renk", attributeType: "COLOR", values: [
    { valueId: 1, value: "Gold" }, { valueId: 2, value: "Silver" }
  ]},
  { attributeId: 2, attributeName: "Beden", attributeType: "SIZE", values: [
    { valueId: 3, value: "S" }, { valueId: 4, value: "M" }
  ]},
]

const { combinations, limitExceeded } = generateVariantCombinations(axes)
// combinations: [{combinationKey: "1:1|2:3", label: "Gold / S", pairs: [...]}, ...]

const merged = mergeVariantCombinationsWithExisting(combinations, existingVariants, basePrice, skuPrefix)
// Mevcut varyantların id/sku/price/stock değerleri korunur
```

**Kurallar:**
- Maksimum 100 kombinasyon üretilir.
- `combinationKey`: `"attrId1:valId1|attrId2:valId2"` (attributeId'ye göre artan sıra).
- Aynı `combinationKey` bir üründe tekrar oluşturulamaz (`@@unique([productId, combinationKey])`).

---

## Storefront Varyant Seçimi

`ProductDetailClient` — `richAttributes` dizisi dolu varyantlarda otomatik swatch/chip UI aktif olur.

- **COLOR tipi**: Renk swatchi (dolu daire), seçili halde `ring-2` border.
- **Diğerleri**: Chip buton, tükendi/pasif halinde `line-through` ve `cursor-not-allowed`.
- Stok 0 veya `isActive=false` varyant → "Sepete Ekle" butonu disabled.
- `richAttributes` yoksa (eski JSON varyantlar) → `<select>` dropdown fallback.

---

## Sepet

`CartLine` alanları:
```typescript
{
  variantId: number | null
  variantName: string
  variantSku: string | null
  selectedAttributes: { name, slug, type, value, colorHex? }[]
  // ...
}
```

- Aynı `productId + variantId` → miktar artırır.
- Farklı `variantId` → ayrı satır (`@@unique([cartId, productId, variantId])`).
- Varyantlı ürün `variantId=null` ile sepete eklenemez (API 400 döner).

---

## Checkout Doğrulaması (Server-Side)

`app/api/orders/route.ts` — hiçbir fiyat, isim veya attribute client'tan gelmez:

1. Cart DB'den çekilir (client basket yok sayılır).
2. `product.isActive` kontrolü.
3. `variant.isActive` kontrolü → 400 "Varyant artık satışta değil".
4. `variant.stock >= quantity` kontrolü → 409 STOCK_RACE.
5. Fiyat: `resolveCartUnitPrice(product.basePrice, product.compareAtPrice, variant.price, variant.compareAtPrice)`.
6. Toplam server-side hesaplanır.

---

## OrderItem Snapshot

Her sipariş satırında anlık bilgi saklanır (varyant silinse bile siparişte gösterilir):

```typescript
variantName: string | null          // "Gold / 45 cm"
variantSku: string | null           // "KOLYE-A1B2C"
variantSnapshotJson: string | null  // JSON: [{name, value, colorHex?}]
```

Snapshot oluşturma: checkout'ta `row.variant.attributeValues` üzerinden server-side.

---

## Stok

Sipariş oluşturulurken:
```typescript
await tx.productVariant.updateMany({
  where: { id: variantId, productId, stock: { gte: quantity } },
  data: { stock: { decrement: quantity } },
})
// Sonuç 0 satır → STOCK_RACE hatası → 409 dön
```

Race condition güvenli: `gte: quantity` koşulu tek transaction içinde kontrol + güncelleme.

---

## Kategori Filtreleri

URL: `/categories/kolyeler?attrs=renk:Gold,beden:M`

Birden fazla attribute çoklu seçimli, pagination ile uyumlu.
`ProductVariantAttributeValue` ve `ProductAttributeValue` her ikisi de sorgulanır.

---

## JSON Fallback ve Migration

**Eski veri okuma**: `normalizeVariantAttributes(relational, jsonStr)` her iki kaynağı destekler.

**Toplu geçiş**: `scripts/migrate-variant-attributes.ts`

```bash
# Dry-run (yazma yok)
npx ts-node scripts/migrate-variant-attributes.ts

# Uygula
npx ts-node scripts/migrate-variant-attributes.ts --apply

# Production (ek onay gerekli)
npx ts-node scripts/migrate-variant-attributes.ts --apply --production-confirm
```

Script, DB'deki attribute slug'larıyla JSON key'lerini eşleştirir. Eşleşme bulunamazsa o varyant için uyarı verir ve atlar; diğerleri devam eder.

---

## Migration SQL

`prisma/migrations/20260628000000_add_attribute_system/migration.sql`

**Non-destructive**: `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
`attributesJson` silinmez. Eski varyantlar silinmez. OrderItem alanları nullable.

**Uygulamak için** (production veritabanına çalıştırmadan önce):
1. Backup al.
2. Dry-run ile doğrula.
3. Staging'de test et.
4. `mysql < migration.sql` veya `prisma migrate deploy`.
