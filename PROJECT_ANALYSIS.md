# YDY Trend Mevcut Proje Analizi

> Analiz tarihi: 2026-06-28  
> Kod üzerinden doğrulanmıştır; tahmin içeren maddeler "belirsiz" olarak işaretlenmiştir.

---

## 1. Proje Özeti

Proje, Next.js 16 (App Router) + MariaDB/MySQL + Prisma tabanlı tam yığın bir e-ticaret uygulamasıdır. Şu an itibarıyla temel altyapı (veritabanı şeması, kimlik doğrulama, ürün/kategori/sipariş yönetimi, sepet, ödeme) büyük ölçüde oluşturulmuştur. Ancak kodun tamamında "Mobil Tedarik" ve "mobiltedarik.com" marka adı kullanılmakta olup henüz "YDY Trend" adıyla yeniden markalanmamıştır. Bu durum sadece görsel değil, e-posta şablonları, brand sabit dosyaları, CDN hostname listesi ve middleware içindeki alan adı yönlendirmeleri gibi kritik kod noktalarını doğrudan etkiler. Bebek/çocuk giyim odaklı WooCommerce import scripti de mevcut olup hedef kategori (takı, şapka, çanta, moda aksesuarı) ile uyuşmuyor.

---

## 2. Teknoloji Yığını

| Alan | Kullanılan Teknoloji | Sürüm | Açıklama |
|---|---|---|---|
| Framework | Next.js | 16.2.4 | App Router, RSC |
| UI Kütüphanesi | React | 19.2.4 | Server + Client Components |
| Dil | TypeScript | ^5 | strict: true |
| Veritabanı | MySQL / MariaDB | — | `@prisma/adapter-mariadb` ile |
| ORM | Prisma | ^7.7.0 | Generated client: `generated/prisma/` |
| Stil | Tailwind CSS | ^4 | CSS custom properties ile tema |
| Font | Poppins (Google Fonts) | — | 400/500/600/700/800 |
| Rich Text | TipTap | ^3.22.4 | Ürün açıklamaları için |
| Animasyon | Framer Motion | ^12.38.0 | — |
| HTTP İstek | Axios | ^1.15.0 | Client-side API çağrıları |
| Auth | Özel JWT (jsonwebtoken) | ^9.0.3 | NextAuth yok |
| Şifre Hash | bcrypt | ^6.0.0 | — |
| E-posta | Nodemailer | ^8.0.7 | DB'den SMTP ayarları |
| Ödeme | PayTR | — | iyzico/Stripe yok |
| Cache/Oturum | Redis (ioredis) | ^5.10.1 | Kullanımı belirsiz (bkz. §11) |
| Görsel Depolama | Harici CDN | — | `CDN_UPLOAD_URL` env değişkeni |
| Validasyon | Zod | ^4.3.6 | API ve form doğrulaması |
| İkonlar | react-icons | ^5.6.0 | — |
| Barkod | jsbarcode + react-barcode | — | Ürün baskısı |
| QR | qrcode.react | — | — |
| Slug | slugify | ^1.6.9 | URL üretimi |
| Script çalıştırma | tsx | ^4.21.0 | Seed ve import scriptleri |
| Linting | ESLint | ^9 | eslint-config-next |
| Test | — | — | Hiç test yok |
| CI/CD | — | — | Belirsiz (Vercel olabilir) |

---

## 3. Klasör ve Mimari Yapı

```
e-ticaret/
├── app/                    # Next.js App Router (sayfalar + API)
│   ├── admin/              # Admin panel sayfaları (Server Component ağırlıklı)
│   ├── api/                # Route Handler'lar (REST-benzeri API)
│   │   ├── admin/          # Admin-only API endpoint'leri
│   │   ├── auth/           # login, register, forgot-password
│   │   ├── cart/           # Sepet işlemleri
│   │   ├── checkout/       # Sipariş oluşturma
│   │   ├── payment/        # PayTR callback
│   │   └── ...             # Favoriler, arama, adresler vb.
│   ├── cart/               # Sepet sayfası
│   ├── categories/         # Kategori listeleme ([...slug])
│   ├── checkout/           # Ödeme sayfası
│   ├── products/[slug]/    # Ürün detay sayfası
│   ├── sayfa/[slug]/       # Hukuki sayfalar (KVKK, İptal vb.)
│   ├── siparislerim/       # Sipariş geçmişi
│   ├── profil/             # Kullanıcı hesabı
│   └── ...                 # login, register, search vb.
├── components/             # Yeniden kullanılabilir bileşenler
│   ├── admin/              # Admin bileşenleri
│   ├── auth/               # Login/Register formları
│   ├── cart/, checkout/    # Sepet/checkout client bileşenleri
│   ├── home/               # Anasayfa bileşenleri (Header, Slider vb.)
│   └── product/, category/ # Ürün ve kategori UI bileşenleri
├── lib/                    # Yardımcı fonksiyonlar ve servisler
│   ├── emails/             # E-posta şablonları (HTML)
│   ├── admin/              # Admin ayar registry'si
│   └── *.ts                # Auth, cart, prisma, paytr, storage vb.
├── generated/prisma/       # Prisma tarafından üretilen client kodu
├── prisma/
│   ├── schema.prisma       # Veritabanı şeması
│   ├── migrations/         # SQL migration dosyaları
│   └── seed.ts             # Örnek ürün seed scripti
├── scripts/                # Tek seferlik araçlar (WooCommerce import, admin oluşturma)
├── public/                 # Statik dosyalar (logo, görseller)
├── middleware.ts            # www → non-www yönlendirme + güvenlik başlıkları
└── next.config.ts          # Yönlendirmeler, görsel hostname whitelist
```

**Import alias:** `@/*` → proje köküne eşlenir (`tsconfig.json paths`).  
**Render stratejisi:** Admin sayfaları Server Component; etkileşimli formlar `"use client"` ile Client Component.

---

## 4. Mevcut Sayfalar

| Sayfa / Route | Amaç | Veri Kaynağı | Durum |
|---|---|---|---|
| `/` | Anasayfa (slider, ürün bölümleri, SSS, footer) | DB (Prisma, `revalidate: 60`) | Çalışıyor |
| `/login` | Giriş | API `/api/auth/login` | Çalışıyor |
| `/register` | Kayıt | API `/api/auth/register` | Çalışıyor |
| `/forgot-password` | Şifre sıfırlama isteği | API `/api/auth/forgot-password` | Çalışıyor |
| `/reset-password` | Şifre sıfırlama (token ile) | API `/api/auth/reset-password` | Çalışıyor |
| `/products/[slug]` | Ürün detay | DB (Prisma) | Kısmen çalışıyor (mock fallback var) |
| `/categories/[...slug]` | Kategori / ürün listeleme | DB (Prisma) | Çalışıyor |
| `/search` | Arama sonuçları | API `/api/search` | Çalışıyor |
| `/cart` | Sepet | LocalStorage + DB | Çalışıyor |
| `/checkout` | Ödeme formu | DB (Prisma) | Kısmen çalışıyor (yalnızca banka havalesi + PayTR) |
| `/siparislerim` | Sipariş listesi | API `/api/orders` | Çalışıyor |
| `/siparislerim/[orderNo]` | Sipariş detayı | API | Çalışıyor |
| `/profil` | Hesap bilgileri ve adresler | API | Çalışıyor |
| `/sikca-sorulan-sorular` | SSS sayfası | DB (Faq tablosu) | Çalışıyor |
| `/sayfa/[slug]` | Hukuki sayfalar (KVKK, iade vb.) | DB (Setting tablosu, `legalPages.ts`) | Belirsiz |
| `/maintenance` | Bakım modu | Statik | Statik/demo |
| `/not-found` (404) | 404 sayfası | Statik | Çalışıyor |
| **Admin** | | | |
| `/admin` | Dashboard (istatistikler) | API `/api/admin/stats` | Çalışıyor |
| `/admin/products` | Ürün listesi, arama, filtre | DB | Çalışıyor |
| `/admin/products/new` | Yeni ürün ekle | API | Çalışıyor |
| `/admin/products/[id]/edit` | Ürün düzenle | API | Çalışıyor |
| `/admin/products/print-barcodes` | Barkod baskısı | DB | Çalışıyor |
| `/admin/categories` | Kategori yönetimi | API | Çalışıyor |
| `/admin/orders` | Sipariş listesi | DB | Çalışıyor |
| `/admin/orders/[orderNo]` | Sipariş detayı ve durum | API | Çalışıyor |
| `/admin/customers` | Müşteri listesi | API | Çalışıyor |
| `/admin/reviews` | Yorum onaylama | API | Çalışıyor |
| `/admin/coupons` | Kupon yönetimi | API | Çalışıyor |
| `/admin/homepage` | Slider, banner, ürün bölüm yönetimi | API | Çalışıyor |
| `/admin/menus` | Header navigasyon yönetimi | API | Çalışıyor |
| `/admin/faqs` | SSS yönetimi | API | Çalışıyor |
| `/admin/settings` | Site ayarları (branding, SEO) | API | Çalışıyor |
| `/admin/shipping` | Kargo ücret ayarları | API | Çalışıyor |
| `/admin/smtp` | E-posta SMTP yapılandırması | API | Çalışıyor |
| `/admin/bank-transfer` | Havale/EFT banka bilgileri | API | Çalışıyor |
| `/admin/reports` | Raporlar | API | Belirsiz |
| `/admin/activity-log` | Admin işlem geçmişi | DB | Çalışıyor |
| `/admin/phone-order` | Telefon siparişi (POS benzeri) | API | Çalışıyor |
| `/admin/footer-social` | Footer sosyal medya linkleri | API | Çalışıyor |
| `/admin/stock` | Stok yönetimi | API | Kısmen çalışıyor |

---

## 5. Veritabanı Yapısı

**Bağlantı:** `@prisma/adapter-mariadb` adaptörü ile MariaDB/MySQL, `DATABASE_URL` env'inden bağlanır.  
**Migration:** `prisma/migrations/` klasöründe SQL tabanlı.  
**Seed:** `prisma/seed.ts` — bebek giyim ürünleri içeriyor (hedef kategoriyle uyumsuz).

### Modeller ve İlişkiler

| Model | Amaç | Önemli Alanlar | İlişkiler |
|---|---|---|---|
| `User` | Kullanıcı hesabı | id, email, passwordHash, role (CUSTOMER/ADMIN/STAFF), isActive, emailVerified | Address, Order, Cart, Favorite, Review, PasswordResetToken, AdminActivity |
| `AdminActivity` | Admin log (append-only) | actorEmail, action, resourceType, resourceId, metadata, ip | User |
| `PasswordResetToken` | Şifre sıfırlama tokeni | tokenHash (SHA-256), expiresAt, usedAt | User |
| `Address` | Teslimat/fatura adresi | title, fullName, phone, line1-2, district, city, postalCode, isDefault | User, Order |
| `Category` | Ürün kategorisi (ağaç) | name, slug, parentId, showOnHome, sortOrder, imageUrl | self (CategoryTree), Product, HomeProductSection, ProductCategory |
| `Product` | Ürün | name, slug, basePrice, compareAtPrice, sku, barcode, isActive, isFeatured, taxRate, metaTitle, metaDescription, wooProductId | Category, ProductImage, ProductVariant, Favorite, Review, ProductCategory |
| `ProductCategory` | Ürün↔Kategori çoka-çok | productId, categoryId | Product, Category |
| `ProductImage` | Ürün görseli | url, alt, sortOrder, isCover | Product |
| `ProductVariant` | Ürün varyantı (renk/beden) | name, sku, price, compareAtPrice, stock, attributesJson, lowStockThreshold | Product, CartItem, OrderItem, StockMovement |
| `Cart` | Alışveriş sepeti | userId (üye) veya guestToken (misafir) | User, CartItem |
| `CartItem` | Sepet kalemi | cartId, productId, variantId, quantity | Cart, Product, ProductVariant |
| `Order` | Sipariş | orderNo, status, paymentStatus, subtotal, shippingCost, discountTotal, grandTotal, adres snapshot alanları | User, Address, OrderItem, Payment, Shipment |
| `OrderItem` | Sipariş kalemi | name, sku, unitPrice, quantity, lineTotal | Order, Product, ProductVariant |
| `Payment` | Ödeme kaydı | method, status, amount, provider, providerPaymentId, paidAt, receiptUrl | Order |
| `Shipment` | Kargo bilgisi | cargoCompany, trackingNo, shippedAt, deliveredAt | Order |
| `StockMovement` | Stok hareketi | type (IN/OUT/ADJUSTMENT/RETURN), quantity, source, salesChannel | Product, ProductVariant, StoreSale |
| `StoreSale` | Mağaza POS fişi | saleNo, status, grandTotal, paymentMethod, createdByUserId | User, StoreSaleLine, StockMovement |
| `StoreSaleLine` | POS satır | productId, variantId, unitPrice, lineTotal | StoreSale |
| `Faq` | SSS | question, answer, category, showOnHome, isActive, sortOrder | — |
| `Favorite` | Favori | userId, productId | User, Product |
| `Coupon` | Kupon | code, type (PERCENTAGE/FIXED), value, minPurchase, maxDiscount, startDate, endDate, usageLimit | — |
| `Review` | Ürün yorumu | rating, comment, status (PENDING/APPROVED/REJECTED) | Product, User |
| `Slider` | Anasayfa slider | badgeText, title, subtitle, buttonText/Link, imageUrl, featuresJson, sortOrder | — |
| `Banner` | Banner görseli | title, imageUrl, linkUrl, position, sortOrder | — |
| `HeaderNavItem` | Header menü öğesi | label, href, sortOrder, childrenJson | — |
| `Setting` | Anahtar-değer ayar deposu | key, value, type | — (SMTP, kargo, branding, SEO vb.) |
| `HomeProductSection` | Anasayfa ürün bölümü | title, type (CATEGORY/PRODUCT_LIST), categoryId, productsJson | Category |

**Soft delete:** Yok — kayıtlar fiziksel siliniyor.  
**Audit timestamp:** `createdAt` + `updatedAt` çoğu modelde mevcut.  
**Transaction:** Sipariş oluşturma ve stok düşme işlemlerinde kullanılıyor (belirsiz — API kaynak kodu tam incelenmedi).

---

## 6. API ve Server İşlemleri

### Auth
| Endpoint | Method | Amaç | Auth | Durum |
|---|---|---|---|---|
| `/api/auth/login` | POST | JWT cookie ile giriş | — | Çalışıyor |
| `/api/auth/register` | POST | Yeni kullanıcı kaydı | — | Çalışıyor |
| `/api/auth/logout` | POST | Cookie silme | Cookie | Çalışıyor |
| `/api/auth/forgot-password` | POST | Sıfırlama e-postası gönder | — | Çalışıyor |
| `/api/auth/reset-password` | POST | Token ile şifre değiştir | Token | Çalışıyor |

### Mağaza (public)
| Endpoint | Method | Amaç | Auth | Durum |
|---|---|---|---|---|
| `/api/cart` | GET/POST/PATCH/DELETE | Sepet CRUD | Opsiyonel | Çalışıyor |
| `/api/checkout` | POST | Sipariş oluşturma + PayTR/havale | Opsiyonel | Çalışıyor |
| `/api/payment/callback` | POST | PayTR webhook | HMAC imzası | Çalışıyor |
| `/api/payment/bank-transfer` | POST | Havale bildirimi | Cookie | Çalışıyor |
| `/api/orders` | GET | Sipariş listesi (kullanıcı) | Cookie | Çalışıyor |
| `/api/favorites/toggle` | POST | Favori ekle/kaldır | Cookie | Çalışıyor |
| `/api/search` | GET | Ürün ve kategori arama | — | Çalışıyor |
| `/api/addresses` | GET/POST/PUT/DELETE | Adres yönetimi | Cookie | Çalışıyor |
| `/api/profile` | GET/PUT | Profil bilgileri | Cookie | Çalışıyor |
| `/api/categories` | GET | Kategori listesi | — | Çalışıyor |
| `/api/products` | GET | Ürün listesi (filtreleme) | — | Çalışıyor |

### Admin API (tamamı `role === "ADMIN"` kontrolü içeriyor)
| Endpoint | Method | Amaç | Durum |
|---|---|---|---|
| `/api/admin/stats` | GET | Dashboard istatistikleri | Çalışıyor |
| `/api/admin/products` | GET/POST | Ürün listele / oluştur | Çalışıyor |
| `/api/admin/products/[id]` | GET/PUT/DELETE | Ürün CRUD | Çalışıyor |
| `/api/admin/products/bulk` | POST | Toplu işlem | Çalışıyor |
| `/api/admin/products/barcodes` | GET | Barkod verisi | Çalışıyor |
| `/api/admin/categories` | GET/POST | Kategori CRUD | Çalışıyor |
| `/api/admin/orders` | GET | Sipariş listesi | Çalışıyor |
| `/api/admin/orders/[orderNo]` | GET/PATCH | Sipariş detay / durum güncelle | Çalışıyor |
| `/api/admin/orders/bulk` | PATCH | Toplu durum güncelleme | Çalışıyor |
| `/api/admin/customers` | GET | Müşteri listesi | Çalışıyor |
| `/api/admin/customers/[id]` | GET/PATCH/DELETE | Müşteri işlemleri | Çalışıyor |
| `/api/admin/reviews` | GET/PATCH | Yorum onaylama | Çalışıyor |
| `/api/admin/coupons` | GET/POST | Kupon CRUD | Çalışıyor |
| `/api/admin/homepage/sliders` | GET/POST | Slider CRUD | Çalışıyor |
| `/api/admin/homepage/sliders/[id]` | PUT/DELETE | Slider güncelle/sil | Çalışıyor |
| `/api/admin/homepage/banners` | GET/POST/PUT/DELETE | Banner CRUD | Çalışıyor |
| `/api/admin/homepage/sections` | GET/POST/PUT/DELETE | Ürün bölüm yönetimi | Çalışıyor |
| `/api/admin/navigation` | GET/POST/PUT/DELETE | Menü yönetimi | Çalışıyor |
| `/api/admin/faqs` | GET/POST/PUT/DELETE | SSS yönetimi | Çalışıyor |
| `/api/admin/settings` | GET/PUT | Site ayarları | Çalışıyor |
| `/api/admin/shipping` | GET/PUT | Kargo ayarları | Çalışıyor |
| `/api/admin/smtp` | GET/PUT | SMTP ayarları | Çalışıyor |
| `/api/admin/smtp/test` | POST | SMTP test e-postası | Çalışıyor |
| `/api/admin/bank-transfer` | GET/PUT | Havale banka bilgileri | Çalışıyor |
| `/api/admin/stock` | GET/POST | Stok hareketi | Çalışıyor |
| `/api/admin/upload` | POST | CDN'e görsel yükleme | Çalışıyor |
| `/api/admin/reports` | GET | Satış raporları | Belirsiz |
| `/api/admin/phone-order` | POST | Telefon siparişi | Çalışıyor |
| `/api/admin/footer-social` | GET/PUT | Footer sosyal linkler | Çalışıyor |

**Server Actions:** Kullanılmıyor; tüm veri değişimleri API Route Handler üzerinden yapılmakta.

---

## 7. E-Ticaret Modül Durumu

| Modül | Durum | Mevcut Özellikler | Eksikler / Notlar |
|---|---|---|---|
| Ürünler | ✅ Mevcut | Liste, detay, slug, SEO alanları, aktif/pasif, öne çıkan | — |
| Kategoriler | ✅ Mevcut | Ağaç yapısı (parentId), slug, görsel, anasayfada göster | — |
| Markalar | ❌ Yok | — | Ayrı marka modeli yok; `attributesJson` ile geçici çözüm yapılabilir |
| Ürün Varyantları | ✅ Mevcut | `ProductVariant`: sku, price, stock, attributesJson | `attributesJson` yapılandırılmamış; renk/beden için standart seçenek tablosu yok |
| Renk/Beden Seçenekleri | 🔶 Kısmen | `attributesJson` alanında JSON ile | Standart `Attribute` + `AttributeValue` modeli yok |
| Ürün Görselleri | ✅ Mevcut | Çoklu görsel, sıralama, isCover | CDN bağımlısı |
| Stok Yönetimi | ✅ Mevcut | `StockMovement`, lowStockThreshold, POS/web ayrımı | — |
| SKU ve Barkod | ✅ Mevcut | Ürün ve varyant düzeyinde; barkod baskı sayfası var | — |
| Fiyat ve İndirim | ✅ Mevcut | basePrice, compareAtPrice, vergi (taxRate, isTaxIncluded) | — |
| Kuponlar | ✅ Mevcut | PERCENTAGE / FIXED, tarih aralığı, kullanım limiti | Kupon kullanım kaydı (`usageCount`) var; checkout entegrasyonu belirsiz |
| Sepet | ✅ Mevcut | Üye sepeti (DB) + misafir sepeti (guestToken) | — |
| Favoriler | ✅ Mevcut | Üye favorileri, toggle API | — |
| Karşılaştırma | ❌ Yok | — | Şema yok, UI yok |
| Checkout | ✅ Mevcut | Adres, kargo, havale + PayTR | Yalnızca BANK_TRANSFER schema.ts'e göre varsayılan; PayTR entegrasyonu da var |
| Adres Yönetimi | ✅ Mevcut | Çoklu adres, varsayılan adres, il/ilçe JSON | — |
| Siparişler | ✅ Mevcut | Tam sipariş şeması, durum makinesi, misafir sipariş | — |
| Sipariş Durumları | ✅ Mevcut | PENDING/PAID/PROCESSING/SHIPPED/DELIVERED/CANCELLED/REFUNDED | — |
| Ödeme Sistemi | ✅ Mevcut | PayTR iframe, havale/EFT | Kart ödemesi yalnızca PayTR üzerinden |
| Kargo Entegrasyonu | 🔶 Kısmen | `Shipment` tablosu (takip no), kargo ücret ayarı | Kargo firması API entegrasyonu yok (Yurtiçi, Aras vb.) |
| İade ve Değişim | ❌ Yok | `OrderStatus.REFUNDED` enum'u var | İade talebi akışı, iade modeli yok |
| Kullanıcı Hesabı | ✅ Mevcut | Profil, adres, sipariş geçmişi | e-posta değişikliği belirsiz |
| Yorum ve Puanlama | ✅ Mevcut | Rating, comment, moderasyon (PENDING/APPROVED/REJECTED) | Ürün detay sayfasında görüntüleme belirsiz |
| Arama ve Filtreleme | 🔶 Kısmen | Metin araması, kategori filtresi | Fiyat aralığı, renk, beden filtresi belirsiz |
| Kampanyalar | ❌ Yok | Kupon var ama kampanya/indirim event modeli yok | — |
| Banner Yönetimi | ✅ Mevcut | Position bazlı banner, admin yönetimi | — |
| Slider Yönetimi | ✅ Mevcut | Çok butonlu slider, featuresJson, sortOrder | — |
| Site Ayarları | ✅ Mevcut | `Setting` key-value tablosu, branding, SEO, SMTP | — |
| İletişim Formları | ❌ Yok | — | — |
| E-posta Bildirimleri | ✅ Mevcut | Sipariş onay, ödeme onay, şifre sıfırlama | Nodemailer + DB SMTP ayarı |
| SMS Bildirimleri | ❌ Yok | — | — |
| Fatura Sistemi | 🔶 Kısmen | Payment.receiptUrl + makbuz upload | Yasal e-fatura/e-arşiv entegrasyonu yok |
| POS / Mağaza Satışı | ✅ Mevcut | `StoreSale`, `/admin/phone-order`, stok etkisi | Web sipariş sisteminden ayrı |
| Hukuki Sayfalar | 🔶 Kısmen | `/sayfa/[slug]` route var, `legalPages.ts` var | İçerik DB'de mi statik mi belirsiz |
| SSS | ✅ Mevcut | DB tabanlı, anasayfa ve SSS sayfası | — |

---

## 8. Admin Panel Durumu

### Mevcut Özellikler
- **Dashboard:** `AdminActivity` ve sipariş tablolarından istatistik (kesin içerik belirsiz).
- **Ürünler:** Liste (sayfalama, arama, kategori filtresi, sıralama), yeni ürün, düzenleme, toplu işlem, barkod baskısı.
- **Kategoriler:** CRUD, alt kategori, görsel yükleme.
- **Siparişler:** Liste (filtreler), detay, durum değiştirme, toplu güncelleme.
- **Müşteriler:** Liste, detay, aktif/pasif, silme.
- **Yorumlar:** Onaylama/reddetme paneli.
- **Kuponlar:** CRUD.
- **Anasayfa Yönetimi:** Slider, banner, ürün bölümleri tek sekmeli sayfada.
- **Menü Yönetimi:** Header navigasyon öğeleri, sıralama.
- **SSS Yönetimi:** CRUD, sıralama.
- **Ayarlar:** Branding, SEO, OG görseli.
- **Kargo:** Ücretsiz kargo eşiği ve standart ücret.
- **SMTP:** Tam e-posta sunucu yapılandırması + test gönderimi.
- **Banka Havalesi:** IBAN ve banka bilgisi yönetimi.
- **Stok:** Stok hareketi girişi.
- **Admin Log:** `AdminActivity` tablosundan geçmiş görüntüleme.
- **Telefon Siparişi:** Doğrudan sipariş/POS girişi.
- **Footer Sosyal:** Sosyal medya link yönetimi.

### Eksikler / Sorunlar
- Raporlar sayfası (`/admin/reports`) mevcut ama içerik belirsiz.
- Admin kullanıcı yönetimi (admin oluşturma yalnızca CLI scriptiyle: `scripts/create-admin.ts`).
- İade/değişim yönetim akışı yok.
- Kargo firması entegrasyonu yok (takip no manuel girilmekte).
- Ürün varyant attribute UI'si `attributesJson` düz metin gibi çalışıyor; yapılandırılmış renk/beden seçici eksik.
- İletişim formu yönetimi yok.

---

## 9. Auth ve Yetkilendirme

**Sistem:** NextAuth/Auth.js kullanılmıyor. Tamamen özel JWT tabanlı.

**Akış:**
1. `POST /api/auth/login` → bcrypt ile şifre doğrulama → `jsonwebtoken` ile access token üretimi → httpOnly `token` cookie.
2. `lib/authSession.ts`: Sunucu bileşeni ve API route'larında `cookies()` → `verifyAccessToken(token)` → `{ userId, email, role }`.
3. Admin erişim kontrolü: Her admin API route'unda `session.role !== "ADMIN"` ile 403 dönüşü.
4. Middleware'de admin rotası güvenlik kontrolü yok (yalnızca www yönlendirme + güvenlik başlıkları). Admin sayfaları kendi Server Component içinde kontrol edebilir — belirsiz.

**Şifre sıfırlama:** Token URL'de ham, DB'de SHA-256 hash ile saklanıyor (`PasswordResetToken`). `usedAt` ile tek kullanım güvencesi var.

**e-posta doğrulama:** `emailVerified` alanı şemada var ama doğrulama e-postası gönderme akışı belirsiz.

**Misafir sepet/sipariş:** `guestToken` httpOnly cookie + DB Cart ile destekleniyor. Giriş sonrası sepet birleştirme (`lib/mergeGuestCart.ts`) var.

**Güvenlik notları:**
- Rate limiting checkout ve forgot-password için in-memory (Map) ile uygulanmış. Çok instance'lı production'da sıfırlanır; Redis kullanılmıyor (Redis import var ama rate limiting'de kullanılmıyor — belirsiz).
- JWT yenileme token mekanizması yok (refresh token eksik; token süresi belirsiz).

---

## 10. Tasarım Sistemi

**Renk Paleti:**
| Token | Değer | Kullanım |
|---|---|---|
| `--brand-navy` | `#082A55` | Birincil koyu renk, header |
| `--brand-teal` | `#08A6B8` | Birincil vurgu rengi |
| `--brand-blue` | `#22B8F0` | İkincil mavi |
| `--brand-blue-light` | `#EFF9FC` | Açık arka plan |
| `--brand-page-bg` | `#F7F9FC` | Sayfa arka planı |
| `--brand-text` | `#172033` | Ana metin |
| `--brand-muted` | `#667085` | İkincil metin |
| `--brand-success` | `#16A36A` | Başarı |
| `--brand-danger` | `#F04438` | Hata |

> ⚠️ Bu renkler `lib/brandColors.ts` içinde de `BRAND_NAVY`, `BRAND_TEAL` vb. ile sabit olarak tanımlanmış ve e-posta şablonlarında kullanılıyor.

**Font:** Poppins (Google Fonts) — 400/500/600/700/800 — CSS variable `--font-poppins`.

**Stil Altyapısı:** Tailwind CSS v4 (`@import "tailwindcss"`) + CSS custom properties. Tema Tailwind `@theme inline` bloğu ile token'lara bağlanıyor.

**UI Kütüphanesi:** Bağımsız özel bileşenler; shadcn/ui, Material UI, Ant Design gibi hazır kütüphane yok.

**İkon:** react-icons (^5.6.0).

**Animasyon:** Framer Motion.

**Form yönetimi:** Kontrollü React state; React Hook Form veya Formik kullanılmıyor.

**Toast/Bildirim:** Özel implementasyon (belirsiz); react-hot-toast veya Sonner gibi kütüphane import'u görülmedi.

**Modal/Dialog:** Özel bileşenler (belirsiz).

**Responsive:** Tailwind responsive prefix'leri (`sm:`, `md:`, `lg:`) kullanılıyor.

---

## 11. Teknik Borçlar ve Riskler

### 🔴 Kritik

**1. Marka Adı Uyumsuzluğu (YDY Trend vs. Mobil Tedarik)**
- Sorun: `lib/brandColors.ts`, `middleware.ts`, `next.config.ts`, tüm e-posta şablonları, `lib/siteUrl.ts`, DB ayarları "Mobil Tedarik" ve "mobiltedarik.com" adıyla dolu.
- İlgili: `lib/brandColors.ts`, `middleware.ts`, `next.config.ts`, `lib/emails/`, `lib/siteUrl.ts`
- Etki: Sitenin başka bir marka adıyla yayına gitmesi, e-postalarda yanlış marka görünmesi.
- Çözüm: Sistematik find-replace + CDN hostname güncelleme + DB'deki Setting kayıtları güncelleme.

**2. Admin Paneline Middleware Güvenlik Katmanı Eksikliği**
- Sorun: `middleware.ts` sadece www yönlendirme ve başlıklar yapıyor; `/admin/*` rotaları middleware seviyesinde korunmuyor.
- İlgili: `middleware.ts`, `app/admin/layout.tsx`
- Etki: Giriş yapmamış kullanıcı `/admin` rotalarını URL'den açabilir (sayfa seviyesinde kontrol varsa kurtarır — belirsiz).
- Çözüm: Middleware'e `/admin` için JWT doğrulama ve yönlendirme ekle.

**3. JWT Refresh Token Mekanizması Yok**
- Sorun: Yalnızca access token var; token süresi ve yenileme mekanizması belirsiz.
- İlgili: `lib/jwt.ts`, `lib/authSession.ts`
- Etki: Uzun oturum güvenliği yok; token süresi dolunca kullanıcı çalışma ortasında çıkar.
- Çözüm: Refresh token + rotate mekanizması ekle.

**4. In-Memory Rate Limiting**
- Sorun: `checkoutRateLimit.ts` ve `forgotPasswordRateLimit.ts` `Map` tabanlı, process-local.
- İlgili: `lib/checkoutRateLimit.ts`, `lib/forgotPasswordRateLimit.ts`
- Etki: Çok sunuculu veya yeniden başlatma durumunda sıfırlanır; DDoS/brute-force koruması işlevsiz.
- Çözüm: Redis tabanlı rate limiting (ioredis zaten kurulu).

### 🟠 Yüksek

**5. e-posta Doğrulama Akışı Tamamlanmamış**
- Sorun: `emailVerified` alanı var ama aktivasyon e-postası gönderme akışı belirsiz.
- İlgili: `app/api/auth/register/route.ts`, `User.emailVerified`
- Etki: Sahte e-postalarla kayıt mümkün olabilir.

**6. Ürün Varyant Yapısı Esnek Değil**
- Sorun: Renk/beden varyantları `attributesJson` (düz metin JSON) ile tutuluyor; standart Attribute/Option şeması yok.
- İlgili: `ProductVariant.attributesJson`
- Etki: UI filtreleme, stok raporlama ve katalog kalitesi düşük.
- Çözüm: `Attribute` + `AttributeValue` + `VariantOption` modelleri ekle.

**7. Görsel Depolama CDN Bağımlılığı ve Local Fallback Yok**
- Sorun: `lib/storage.ts` harici `CDN_UPLOAD_URL`'e bağlı; çevrimdışı veya CDN yoksa görsel yükleme tamamen durur.
- İlgili: `lib/storage.ts`
- Etki: Geliştirme ortamı ve CDN kesintilerinde üretim işlemleri duruverir.
- Çözüm: Local `public/uploads` fallback veya S3-compatible (MinIO) alternatif ekle.

**8. Seed Verisi Hedef Kategoriyle Uyumsuz**
- Sorun: `prisma/seed.ts` bebek giyim ürünleri içeriyor; YDY Trend takı/aksesuar kategorisinde.
- İlgili: `prisma/seed.ts`
- Etki: Test ve demo veritabanı yanlış kategori verileriyle doluyor.

### 🟡 Orta

**9. Mock Product Detail Fallback**
- Sorun: `lib/mockProductDetail.ts` kullanılıyor; bazı ürün detay senaryoları mock veriye düşüyor.
- İlgili: `lib/mockProductDetail.ts`, `app/products/[slug]/page.tsx`
- Etki: Gerçek olmayan içerik production'da görünebilir.

**10. Next/Image `unoptimized: true`**
- Sorun: `next.config.ts` içinde `images: { unoptimized: true }`.
- İlgili: `next.config.ts`
- Etki: Next.js'nin otomatik görsel optimizasyonu (WebP, AVIF, boyut) devre dışı.
- Çözüm: CDN kendi optimizasyonu yapıyorsa kabul edilebilir; yoksa kaldır.

**11. Console.log / Console.error Üretim Kodu İçinde**
- Sorun: Birçok API route ve lib dosyasında `console.error` var; bazıları `console.log`.
- İlgili: `lib/storage.ts`, `app/admin/products/*`, `app/admin/orders/*` vb.
- Etki: Üretimde log kirliliği; hassas hata mesajları log sistemine sızabilir.

**12. Sitemap ve robots.txt Yok**
- Sorun: Yalnızca `layout.tsx`'te `robots: index/follow` metadata var; `app/sitemap.ts` veya `app/robots.ts` dosyası yok.
- İlgili: `app/`
- Etki: Arama motoru taraması ve SEO.

**13. Redis Bağlantısı Lazy-Init**
- Sorun: `lib/redis.ts` modül yüklendiğinde bağlantı açıyor; Redis yoksa uygulama hata verebilir.
- İlgili: `lib/redis.ts`
- Etki: Redis kurulmadan uygulama başlatılamayabilir.

### 🟢 Düşük

**14. İade/Değişim Modülü Yok**
- Sorun: `REFUNDED` enum değeri var ama iş akışı yok.

**15. SMS Bildirimi Yok**

**16. Karşılaştırma Özelliği Yok**

**17. Kargo Firması API Entegrasyonu Yok**

---

## 12. Eksik Modüller

| Modül | Açıklama |
|---|---|
| Marka (Brand) yönetimi | Ayrı marka kataloğu; ürünlere marka atama |
| Yapılandırılmış Varyant Seçenekleri | Renk/beden için standart Attribute şeması |
| İade ve Değişim Akışı | Müşteri talebi, onay, stok iade |
| Ürün Karşılaştırma | Yan yana özellik karşılaştırma |
| Kargo Firması Entegrasyonu | Yurtiçi Kargo, MNG, Aras API |
| İletişim Formu | Müşteri mesajları + admin görüntüleme |
| SMS Bildirimi | Sipariş/kargo SMS |
| Kampanya Yönetimi | Belirli tarih aralığı, kategori bazlı indirim event'leri |
| e-Fatura / e-Arşiv | Yasal fatura otomasyonu |
| Wishlist Paylaşımı | Favori listesini paylaşma |
| Ürün Yorumu — Frontend Görünümü | Admin onayı var; ürün sayfasında görüntüleme belirsiz |
| Sitemap.xml + robots.txt | Otomatik dinamik sitemap |
| Admin Kullanıcı Yönetimi | Admin panelinden admin/staff oluşturma |
| Refresh Token | JWT oturum yenileme |
| Stok Uyarısı | Düşük stok bildirim sistemi |

---

## 13. Önerilen Geliştirme Yol Haritası

### Faz 1: Marka Geçişi ve Kritik Düzeltmeler
- [ ] "Mobil Tedarik" → "YDY Trend" rebrand: `lib/brandColors.ts`, `middleware.ts`, `next.config.ts`, `lib/emails/`, `lib/siteUrl.ts`, DB Setting kayıtları
- [ ] `middleware.ts`'e `/admin` JWT koruma katmanı ekle
- [ ] JWT refresh token mekanizması
- [ ] Redis tabanlı rate limiting
- [ ] `prisma/seed.ts` YDY Trend ürün kategorileriyle güncelle
- [ ] `emailVerified` doğrulama akışını tamamla

### Faz 2: Mağaza ve Katalog
- [ ] `Attribute` + `AttributeValue` yapılandırılmış varyant sistemi
- [ ] Marka (Brand) modeli ve ürüne bağlama
- [ ] Ürün detay sayfası — yorum görüntüleme bölümü
- [ ] Fiyat aralığı / renk / beden filtresi
- [ ] Mock product detail fallback'i kaldır
- [ ] `next.config.ts` CDN hostname'lerini YDY Trend CDN'i ile güncelle

### Faz 3: Sepet ve Ödeme
- [ ] Kupon checkout entegrasyonunu doğrula
- [ ] PayTR test → canlı mod geçiş kontrolleri
- [ ] Banka havalesi onay akışını manuel test et
- [ ] Kargo firması tracking entegrasyonu (en az manuel tracking no + bildirim)

### Faz 4: Sipariş ve Müşteri Yönetimi
- [ ] İade/değişim talebi akışı ve modeli
- [ ] Stok düşük uyarısı bildirimi
- [ ] Admin kullanıcı (ADMIN/STAFF) yönetim sayfası
- [ ] Sipariş e-posta şablonlarını YDY Trend markasına güncelle

### Faz 5: Admin Paneli Geliştirme
- [ ] Raporlar sayfasını doğrula ve gerekirse genişlet
- [ ] Ürün toplu içe aktarma (CSV) özelliği
- [ ] Admin dashboard gerçek zamanlı istatistik
- [ ] Stok uyarıları paneli

### Faz 6: SEO, Performans ve Güvenlik
- [ ] `app/sitemap.ts` — dinamik ürün/kategori sitemap
- [ ] `app/robots.ts`
- [ ] Ürün ve kategori Schema.org JSON-LD yapılandırılmış verisi
- [ ] `next.config.ts` `images.unoptimized: false` ve CDN/Next görsel optimizasyon kararı
- [ ] Console.log temizliği
- [ ] Redis rate limiting üretim testi
- [ ] CSP (Content Security Policy) başlığı ekle

### Faz 7: Test ve Production Hazırlığı
- [ ] Unit test altyapısı (Vitest veya Jest)
- [ ] E2E test (Playwright): kayıt, giriş, ürün ekleme, checkout, sipariş takibi
- [ ] `.env.example` dosyası oluştur
- [ ] Docker compose (MySQL + Redis + app)
- [ ] CI/CD pipeline (GitHub Actions önerilen)
- [ ] Production build ve Lighthouse performans testi

---

## 14. Sonuç

**Yaklaşık Tamamlanma Seviyesi: ~60%**

Bu oran aşağıdaki kriterlere göre belirlenmiştir:

| Kriter | Ağırlık | Tamamlanma |
|---|---|---|
| Veritabanı şeması ve altyapı | %15 | ~90% |
| Auth ve kullanıcı yönetimi | %10 | ~75% |
| Ürün/Kategori kataloğu | %15 | ~70% |
| Sepet ve checkout | %15 | ~65% |
| Ödeme entegrasyonu | %10 | ~70% |
| Admin paneli | %15 | ~70% |
| SEO ve performans | %10 | ~25% |
| Test ve güvenlik | %10 | ~15% |

Projenin temel "kemik yapısı" (şema, API katmanı, auth, ödeme) sağlam ve üretim kalitesine yakın kodlanmıştır. Asıl eksiklikler: marka geçişi (kritik), yapılandırılmış varyant sistemi, iademanagement, SEO altyapısı ve sıfır test coverage'dır.

---

## 15. Devam Edecek Geliştirici İçin Teknik Bağlam

### Çalışma Ortamı Gereksinimleri
- Node.js (tsx 4 destekli; Node 20 önerilir)
- MariaDB/MySQL — `DATABASE_URL` env ile bağlantı
- Redis — `REDIS_HOST` / `REDIS_PORT` env (rate limiting; başlatılmazsa uygulama hata verebilir)
- Harici CDN — `CDN_UPLOAD_URL`, `CDN_UPLOAD_TOKEN`, `CDN_BASE_URL` env (görsel yükleme için zorunlu)
- PayTR — `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`, `PAYTR_TEST_MODE` env

### Kilit Dosyalar
| Dosya | Ne İçin |
|---|---|
| `prisma/schema.prisma` | Tüm veri modeli; değişiklik → `prisma migrate dev` |
| `generated/prisma/` | Prisma'nın ürettiği client; elle düzenlenmez |
| `lib/authSession.ts` | Her API route'ta oturum kontrolü buradan |
| `lib/prisma.ts` | Singleton Prisma client |
| `lib/storage.ts` | Görsel yükleme → CDN |
| `lib/paytr.ts` | PayTR token üretimi ve callback doğrulama |
| `lib/brandColors.ts` | Marka renk sabitleri (e-posta şablonları dahil) |
| `lib/shippingSettings.ts` | Kargo ücreti ve ücretsiz kargo eşiği (DB'den) |
| `lib/smtpSettings.ts` | E-posta SMTP (DB'den, admin paneli üzerinden) |
| `middleware.ts` | www yönlendirme + güvenlik başlıkları |
| `app/api/checkout/route.ts` | Sipariş oluşturma akışının kalbi |
| `app/api/payment/callback/route.ts` | PayTR webhook |

### Önemli Konvansiyonlar
- Admin API'leri: `getSessionFromCookies()` → `session.role !== "ADMIN"` → 403.
- Görsel yükle: base64 data URL → `resolveImageUrl()` → CDN'e POST → URL döner.
- Kargo ve SMTP ayarları `Setting` tablosunda key-value olarak saklanır; `getShippingSettings(prisma)` ve `sendMail()` her çağrıda DB'den okur.
- `@/*` import alias `tsconfig.json`'da tanımlı; tüm iç import'lar bunu kullanır.
- Prisma adapter: `@prisma/adapter-mariadb`; standart `PrismaClient()` yerine `new PrismaClient({ adapter })` kullanılır (bkz. `lib/prisma.ts`).

### ⚠️ Rebrand Önceliği
Kod tabanının tamamında "Mobil Tedarik" ve "mobiltedarik.com" referansları bulunmaktadır. İlk commit öncesinde bu isimleri "YDY Trend" ile değiştirmek gereklidir. Arama yapılacak string'ler:
- `mobiltedarik.com`
- `Mobil Tedarik`
- `LOGO_ALT = "Mobil Tedarik"` (`lib/brandColors.ts:19`)
- `middleware.ts` satır 10-15 (www.mobiltedarik.com yönlendirme)
- `next.config.ts` remotePatterns hostname listesi
