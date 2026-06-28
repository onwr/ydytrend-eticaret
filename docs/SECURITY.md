# YDY Trend — Security Özeti

## Uygulama katmanı
- CSRF: Origin/Referer (`lib/csrf.ts`)
- Rate limit: Redis + memory fallback
- Security headers: CSP, HSTS (prod), COOP/CORP
- Auth cookies: httpOnly, secure, merkezi helper
- Admin: JWT + role check (UI + API)

## Upload
- MIME / uzantı / boyut route bazlı
- Path traversal engeli — CDN URL allowlist
- Admin upload audit log

## Audit
- AdminActivity — hassas alanlar maskeli
- Request ID metadata'da

## Raporlama
- Log/monitoring'de password, JWT, IBAN, DATABASE_URL yasak

Detay: `docs/PRODUCTION_READINESS.md`
