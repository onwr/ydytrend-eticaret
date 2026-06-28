# YDY Trend — Migrasyon Notları

Faz 1 kapsamında yapılan marka dönüşümünde tespit edilen elektronik/yedek parça sektörüne özgü kodlar.

---

## 1. Yalnızca Metin Değişikliği Gereken Alanlar (Tamamlandı)

Bu alanlar Faz 1'de güncellendi, teknik değişiklik gerekmez:

| Konum | Eski İçerik | Yeni İçerik |
|---|---|---|
| `lib/brand.ts` | (yoktu) | Merkezi marka yapılandırması oluşturuldu |
| `lib/brandColors.ts` | navy/teal renk paleti | blush/gold YDY Trend paleti |
| `lib/heroContent.ts` | Yedek parça defaults | Moda aksesuar defaults |
| `lib/sparePartsConfig.ts` | Telefon markaları, parça kategorileri | Moda kategorileri (takı, çanta, şapka) |
| `lib/defaultHeaderNav.ts` | Elektronik nav öğeleri | Moda kategorileri nav öğeleri |
| `lib/legalPages.ts` | "Mobil Tedarik" / "Mareşal" / "mobiltedarik.com" | [ŞİRKET ADI] / [ALAN ADI] yer tutucuları |
| `lib/mockProductDetail.ts` | Elektronik ürün mock'ları | Moda aksesuar mock'ları |
| `lib/siteSettings.ts` | "Mobil Tedarik" fallback | BRAND_NAME importu |
| `lib/bankTransferSettings.ts` | "Mobil Tedarik" | BRAND_NAME importu |
| `lib/emails/*.ts` | "Mobil Tedarik" fallback | "YDY Trend" |
| `middleware.ts` | www.mobiltedarik.com yönlendirmesi | Kaldırıldı; admin JWT koruması eklendi |
| `next.config.ts` | mobiltedarik.com remotePatterns | Kaldırıldı |
| `components/home/AnnouncementBar.tsx` | Yedek parça içerik | Moda içerik |
| `components/home/TrustFeatures.tsx` | Teknik servis referansları | Genel e-ticaret |
| `components/home/WholesaleBanner.tsx` | B2B/teknik servis | Sosyal medya / topluluk |
| `components/home/HomeFooter.tsx` | "mobiltedarik.com" copyright | BRAND_NAME; yapısal temizlik |
| `app/globals.css` | navy/teal token değerleri | YDY Trend blush/gold değerleri |
| `app/layout.tsx` | Poppins font | DM Sans + Playfair Display |
| `app/page.tsx` | BrandSelector, DevicePartFinder | Kaldırıldı; fashion sections |

---

## 2. Storefront'tan Gizlenebilir (Veritabanı Değişmeden)

Bu alanlar veritabanı şemasında mevcut ama moda markasında storefront'ta görünmemesi gerekir.
Şema değişikliği **gerekmez** — sadece UI'da koşullu render veya etiket değişikliği:

- **`Product.sku`** — Kısa model numarası gibi gösterilebilir; "Parça No" etiketi kaldırılmalı
- **`Product.attributes`** JSON alanı — Telefona özgü attribute'lar varsa (ör. "Uyumlu Model", "Renk Seçeneği: Siyah / Beyaz") moda product'lar için yeniden yapılandırılabilir; şema değişmeden içerik değişir
- **`ProductVariant.name`** — Bazı kayıtlarda "128GB / Siyah" gibi değerler olabilir; yeni ürünler için düzenlenebilir

---

## 3. Sonraki Fazda Veritabanından Kaldırılabilir (Şimdi Değil)

Bu alanlar şemada var; moda e-ticaretinde kullanılmayacak. Mevcut veriler bozulmadan bırakıldı.
Destructive migration yasak olduğu için bu fazda dokunulmadı:

| Alan | Not |
|---|---|
| `Product.brand` (varsa) | Telefon markası (Apple, Samsung vb.) alanı — moda için "koleksiyon" veya kaldırılabilir |
| `Category` kayıtları: "Ekran", "Batarya" vb. | DB'de duruyor, isActive=false yapılabilir |
| `sparePartsConfig.ts` POPULAR_CATEGORIES | Faz 1'de moda kategorileriyle güncellendi; eski DB kayıtları ayrı |

---

## 4. Genel E-Ticaret için Yeniden Kullanılabilir (Değişiklik Gerekmez)

Bu modüller sektörden bağımsız, doğrudan kullanılabilir:

- `app/api/orders/` — Sipariş yönetimi
- `app/api/auth/` — JWT kimlik doğrulama
- `app/api/payment/callback/` — PayTR callback (HMAC bazlı, genel)
- `app/cart/` — Sepet sistemi
- `app/checkout/` — Ödeme akışı
- `app/admin/` — Tüm admin paneli
- `lib/prisma.ts`, `lib/emails/`, `lib/shippingSettings.ts`
- `prisma/schema.prisma` — Product, Category, Order, User modelleri genel amaçlı

---

## 5. Varyant Sistemi (Gelecek Faz)

Mevcut varyant yapısı (`ProductVariant`) kısmen uyumlu ama moda için güçlendirilmesi gerekebilir:

- Renk + Beden kombinasyonu varyant olarak doğru çalışıyor
- Resim varyant bazlı değil; moda'da renk bazlı görsel değişimi için `ProductVariantImage` tablosu gerekebilir
- Stok takibi variant bazında mevcut — yeterli

---

## 6. Yasal Sayfalar — Önemli Uyarı

`lib/legalPages.ts` dosyasındaki tüm "Mobil Tedarik", "Mareşal" ve "mobiltedarik.com" referansları
`[ŞİRKET ADI]` ve `[ALAN ADI]` yer tutucularıyla değiştirildi.

**Yayın öncesinde bu sayfalar yetkili bir avukat veya hukuk birimince güncellenmelidir.**
Ticaret sicil numarası, şirket adresi, vergi numarası ve domain bilgileri eklenmelidir.

---

_Son güncelleme: Faz 1 — 2026-06-28_
