# YDY Trend — Proje Teslim Dokümanı

Bu doküman, YDY Trend e-ticaret projesinin mevcut haliyle devralınması, local çalıştırılması ve production’a alınması için referans niteliğindedir.

---

## Proje özeti

**YDY Trend**, moda ve aksesuar odaklı bir B2C e-ticaret uygulamasıdır. Next.js App Router üzerinde storefront, admin paneli, sipariş/ödeme, iade-değişim, newsletter, SEO ve operasyonel altyapıyı kapsar.

---

## Kullanılan teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16.x (App Router) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| Dil | TypeScript |
| Veritabanı | MariaDB + Prisma 7 |
| Auth | JWT (httpOnly cookie) |
| Ödeme | PayTR (kart), havale/EFT, kapıda ödeme |
| Mail | Nodemailer 9.x + DB tabanlı SMTP ayarları |
| Cache / rate limit | Redis (opsiyonel; yoksa bellek içi fallback) |
| Upload | Harici CDN (`CDN_UPLOAD_URL`) |

---

## Tamamlanan modüller

- Ürün, kategori, varyant ve attribute sistemi
- Sepet, checkout, kupon, kargo eşiği
- Sipariş yaşam döngüsü ve admin durum yönetimi
- PayTR kart ödemesi + havale dekont yükleme
- İade ve değişim (müşteri + admin)
- Müşteri profili, adresler, favoriler, sipariş geçmişi
- Newsletter abonelik / unsubscribe
- Admin paneli (ürün, sipariş, müşteri, rapor, SMTP, vb.)
- SEO: metadata, robots, sitemap, JSON-LD
- Cookie consent + analytics adapter (GA4, Meta, TikTok — env ile)
- Structured logging, request ID, audit log, health/readiness
- Email outbox + retry kuyruğu
- Cron bakım görevleri

---

## Admin paneli özellikleri

`/admin` — server-side ADMIN/STAFF kontrolü

| Alan | Yol |
|------|-----|
| Dashboard | `/admin` |
| Ürünler | `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit` |
| Kategoriler | `/admin/categories` |
| Attribute’lar | `/admin/attributes` |
| Siparişler | `/admin/orders`, `/admin/orders/[orderNo]` |
| İade/değişim | `/admin/returns`, `/admin/returns/[requestNumber]` |
| Müşteriler | `/admin/customers` |
| Kuponlar | `/admin/coupons` |
| Yorumlar | `/admin/reviews` |
| Newsletter | `/admin/newsletter` |
| Anasayfa / slider | `/admin/homepage` |
| Menüler | `/admin/menus` |
| FAQ | `/admin/faqs` |
| Kargo ayarları | `/admin/shipping` |
| Havale / banka | `/admin/bank-transfer` |
| SMTP | `/admin/smtp` |
| Telefon siparişi | `/admin/phone-order` |
| Raporlar | `/admin/reports` |
| Aktivite log | `/admin/activity-log` |
| Sistem durumu | `/admin/system` |

---

## Müşteri özellikleri

- Anasayfa, kategori listeleme, ürün detay, arama
- Sepet (drawer + sayfa), checkout (çok adımlı)
- Üyelik, giriş, şifre sıfırlama
- Profil: siparişler, favoriler, adresler, iade/değişim
- Statik sayfalar (`/sayfa/[slug]`), SSS, yardım
- Mobil uyumlu storefront header/footer

---

## Gerekli environment değişkenleri

Tam liste: [`.env.example`](../.env.example)

**Zorunlu (production):**

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | MariaDB bağlantı dizesi |
| `JWT_SECRET` | ≥ 32 karakter |
| `NEXT_PUBLIC_SITE_URL` | Canlı site URL (localhost yasak) |

**Önerilen:**

| Değişken | Açıklama |
|----------|----------|
| `REDIS_URL` veya `REDIS_HOST` | Rate limit (production) |
| `CRON_SECRET` | Cron endpoint koruması |
| `CDN_BASE_URL`, `CDN_UPLOAD_URL`, `CDN_UPLOAD_TOKEN` | Görsel upload |
| `PAYTR_*` | Kart ödemesi |
| `ALLOW_INDEXING` | Production: `true`; staging: `false` |
| `TRUST_PROXY` | Reverse proxy arkasında `1` |

**Opsiyonel:** analytics pixel ID’leri, `SENTRY_DSN`, email outbox/upload cleanup env’leri.

> SMTP, banka ve birçok site ayarı **veritabanı `Setting` tablosundan** yönetilir; admin panelden yapılandırılır.

---

## Local çalıştırma

```bash
cp .env.example .env
# .env içinde DATABASE_URL ve JWT_SECRET doldurun

npm install
npx prisma generate
npx prisma migrate deploy   # veya migrate dev (geliştirme)
npm run dev
```

Uygulama varsayılan: `http://localhost:3000`

**İlk admin:**

```bash
npm run admin:create
# veya: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create
```

---

## Production build

```bash
npm ci
npx prisma generate
npm run build
npm run start
```

Build öncesi `npx prisma validate` önerilir.

---

## Migration komutları

**Fresh install / mevcut DB upgrade (deploy sırasında):**

```bash
npx prisma migrate deploy
```

**Test DB checksum doğrulama (yalnızca test DB adları):**

```bash
npm run audit:migrations:test-db
```

> Production migration bu teslim kapsamında uygulanmamıştır. Deploy ekibi bakım penceresinde `migrate deploy` çalıştırmalıdır.

---

## Deploy sırası

1. Kod deploy (build artifact veya git pull + build)
2. `.env` production değerleri (secret’lar güvenli kanaldan)
3. `npx prisma migrate deploy` — production `DATABASE_URL` ile
4. `npm run start` veya process manager (PM2/systemd)
5. Smoke: `/api/health`, `/api/readiness`, ana sayfa, admin giriş
6. Cron job’ları yapılandır (aşağıya bakın)
7. `ALLOW_INDEXING=true` (production), staging’de `false`

Detay: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

---

## İlk admin girişi

1. `npm run admin:create` ile admin kullanıcı oluşturun
2. `/login` → admin hesabıyla giriş
3. `/admin` paneline erişim

---

## Mail ayarları

- Admin: `/admin/smtp`
- DB `Setting` anahtarları: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_MAIL_ENABLED`, vb.
- Test gönderimi: admin SMTP sayfasından
- Başarısız mailler `EmailOutbox` tablosuna yazılır; cron ile retry edilir

---

## Banka / havale ayarları

- Admin: `/admin/bank-transfer`
- IBAN, hesap sahibi, banka adı DB’de saklanır
- Müşteri checkout sonrası `/checkout/havale` üzerinden dekont yükler

---

## CDN / upload ayarları

`.env`:

```
CDN_BASE_URL=https://cdn.ornek.com
CDN_UPLOAD_URL=https://cdn.ornek.com/upload.php
CDN_UPLOAD_TOKEN=...
```

Route bazlı limitler kod içinde tanımlıdır (ör. dekont 5 MB). Yerel `public/uploads/` varsa upload cleanup cron orphan dosyaları tarayabilir.

---

## Cron endpoint’leri

Tümü `POST`, header: `Authorization: Bearer $CRON_SECRET` veya `x-cron-secret`

| Endpoint | Görev |
|----------|--------|
| `/api/cron/maintenance` | Süresi dolmuş şifre sıfırlama token’ları, eski guest sepetler |
| `/api/cron/email-outbox` | Bekleyen e-postaları batch gönderim / retry |
| `/api/cron/upload-cleanup` | Orphan upload temizliği (production’da varsayılan dry-run) |

Önerilen sıklık: maintenance günde 1+, email-outbox 5–15 dk, upload-cleanup haftalık.

---

## Health / readiness endpoint’leri

| Endpoint | Amaç |
|----------|------|
| `GET /api/health` | Liveness — hafif 200 |
| `GET /api/readiness` | DB, Redis, upload, mail, env, monitoring özeti |

Admin `/admin/system` sayfası operasyonel özet sunar (secret gösterilmez).

---

## Bilinen küçük eksikler

- Analytics event’leri tüm storefront akışlarına tam bağlı değil (adapter hazır, kısmi wiring)
- Havale siparişlerinde `purchase` analytics yalnızca `/checkout/basarili` sayfasında
- Return attachment upload API henüz tam entegre değil (schema/validation mevcut)
- CDN `deleteFile` stub — uzak dosya silme CDN tarafında ayrı yönetilmeli
- `npm audit`: Prisma dev / esbuild gibi **dev-only** moderate uyarılar kalabilir
- Tam Sentry SDK (`@sentry/nextjs`) kurulu değil; `SENTRY_DSN` logger tabanlı adapter ile dokümante

---

## Yedekleme ve rollback bağlantıları

| Doküman | Konu |
|---------|------|
| [PRODUCTION_BACKUP_AND_RESTORE.md](./PRODUCTION_BACKUP_AND_RESTORE.md) | DB dump, CDN, restore drill |
| [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) | Build ve env |
| [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) | Günlük kontrol, incident |
| [SECURITY.md](./SECURITY.md) | Güvenlik özeti |
| [KVKK_AND_DATA_RETENTION.md](./KVKK_AND_DATA_RETENTION.md) | Veri saklama |
| [SEO_AND_ANALYTICS.md](./SEO_AND_ANALYTICS.md) | SEO ve consent |
| [OBSERVABILITY.md](./OBSERVABILITY.md) | Log, monitoring |

**Rollback:** önceki build artifact + DB restore (onaylı pencere). Migration geri alma destructive olabilir; yedekten restore tercih edilir.

---

## Deploy sırasında çalıştırılacak migration’lar

Toplam **20** migration. Production’da henüz uygulanmamışsa `npx prisma migrate deploy` tümünü sırayla uygular:

1. `20260417104526_init`
2. `20260419120000_cart_guest_token`
3. `20260419140000_order_guest_snapshot`
4. `20260419142350_add_faq`
5. `20260429120000_header_nav_item`
6. `20260501120000_header_nav_children_json`
7. `20260502183000_product_woo_product_id`
8. `20260502194500_password_reset_token`
9. `20260503120000_admin_activity`
10. `20260504120000_store_sale_retail_channel`
11. `20260621115900_baseline_missing_schema`
12. `20260621115930_slider_core_columns`
13. `20260621120000_hero_slider_content`
14. `20260621180000_payment_receipt`
15. `20260623120000_slider_hero_style`
16. `20260623140000_slider_full_image_display`
17. `20260628000000_add_attribute_system`
18. `20260628120000_faz4_returns_aftersales`
19. `20260628160000_faz5c_query_indexes`
20. `20260629120000_faz5d_email_outbox`

Uygulanmış migration dosyalarını **değiştirmeyin**. Checksum uyumsuzluğu deploy’u engeller.
