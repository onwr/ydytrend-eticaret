# YDY Trend — Production Readiness (Faz 5)

## Risk matrisi (özet)

| Alan | Durum | Risk | Öneri |
|------|-------|------|-------|
| Environment variables | İyileştirildi | Orta | `.env.example` + `lib/env.ts`; production `next start` sıkı doğrulama |
| Authentication | İyi | Orta | JWT 7g; refresh token yok — kısa süreye indirilebilir |
| Authorization | İyi | Orta | Admin API route bazlı; merkezi helper eklenebilir |
| Session/JWT | İyi | Orta | httpOnly + secure; `lib/authCookies.ts` |
| Admin güvenliği | İyi | Orta | UI middleware + API role check |
| Rate limiting | İyileştirildi | Orta | Redis destekli; yoksa bellek fallback + uyarı |
| Input validation | Kısmi | Orta | Kritik route'larda zod; tam API standardizasyonu devam |
| File upload | İyi | Orta | CDN token; admin upload rate limit |
| CSRF | İyileştirildi | Orta | Middleware origin/referer; PayTR callback muaf |
| XSS | İyi | Düşük | React escape; e-posta escapeHtml |
| SQL injection | İyi | Düşük | Prisma parametreli sorgular |
| Open redirect | İyi | Düşük | Dahili linkler |
| SSRF | İyi | Orta | Takip URL http/https; CDN allowlist |
| Headers | İyileştirildi | Düşük | CSP, HSTS (prod), COOP/CORP |
| Cookies | İyileştirildi | Düşük | Merkezi cookie seçenekleri |
| Secrets | İyileştirildi | Orta | JWT prod min 32; client bundle'da secret yok |
| Logging | İyileştirildi | Düşük | `lib/logger.ts`, `lib/logRedaction.ts` — JSON structured |
| Monitoring | Hazır alan | Orta | Sentry DSN; `/api/readiness` monitoring check |
| Backups | Operasyonel | Yüksek | VPS/DB yedek planı dokümante edilmeli |
| Migration strategy | Hazır | Orta | Faz 4 migration test DB'de; prod henüz uygulanmadı |
| SEO | İyi | Düşük | metadata, sitemap, robots |
| Analytics | Hazır alan | Düşük | env ile GA/pixel |
| Consent | Kısmi | Orta | Newsletter consent; cookie banner ayrı |
| Email | İyi | Düşük | DB SMTP; hata transaction'ı rollback etmez |
| Cron/jobs | Eksik | Orta | CRON_SECRET alanı hazır |
| Error handling | İyileştirildi | Orta | `lib/apiError.ts` — kademeli geçiş |
| Cache | Kısmi | Düşük | Next revalidate |
| CDN/images | İyi | Düşük | unoptimized images — prod CDN stratejisi |
| Deployment | Dokümante | Orta | build/start; TRUST_PROXY reverse proxy |
| Rollback | Operasyonel | Orta | Git tag + önceki build |
| Health check | İyileştirildi | Düşük | `/api/health`, `/api/readiness` |
| Database indexes | İyi | Düşük | Prisma schema index'leri |
| Test coverage | İyi | Düşük | Helper + runtime 66 senaryo |

## Environment

- Şablon: `.env.example`
- Doğrulama: `lib/env.ts`, `instrumentation.ts`
- Production `next start`: JWT_SECRET ≥32, NEXT_PUBLIC_SITE_URL zorunlu, localhost yasak

## Rate limiting

- Modül: `lib/rateLimit.ts` (Redis + bellek fallback)
- Limitler: login, register, checkout, newsletter, search, return, cancel, upload

## CSRF

- Modül: `lib/csrf.ts`
- Middleware: mutating `/api/*` (PayTR callback hariç)
- SameSite=Lax cookie + Origin/Referer

## Güvenlik başlıkları

- Modül: `lib/securityHeaders.ts`
- Middleware tüm sayfalara uygular
- Production CSP: `unsafe-eval` yok

## Reverse proxy

`TRUST_PROXY=1` yalnızca güvenilir reverse proxy (nginx/Caddy) arkasında etkinleştirin.
Aksi halde IP rate limit `unknown` kullanır.

## Komutlar

```bash
npx prisma validate
npm run test:helpers
npm run test:runtime
npm run build
npm run start   # production env doğrulaması burada devreye girer
```

## Observability (Faz 5B)

- **Logger:** `lib/logger.ts` — seviyeler `debug|info|warn|error`, JSON çıktı, `LOG_LEVEL` env
- **Redaction:** `lib/logRedaction.ts` — şifre, JWT, IBAN, DATABASE_URL vb. maskelenir
- **Request ID:** `lib/requestId.ts` + middleware — `x-request-id` header; API hatalarında `requestId` alanı
- **Audit log:** `lib/adminActivityLog.ts` — admin login, attribute CRUD, rol değişikliği, newsletter export, refund update; metadata içinde `requestId`
- **Health:** `GET /api/health` — uptime, version, environment (DB yok)
- **Readiness:** `GET /api/readiness` — DB, Redis, upload/CDN, mail, env, monitoring
