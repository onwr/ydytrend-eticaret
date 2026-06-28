# YDY Trend — Observability

## Logging
- `lib/logger.ts` — JSON structured log, `LOG_LEVEL` env
- `lib/logRedaction.ts` — PII redaction

## Request ID
- Middleware: `x-request-id` header
- API errors: `requestId` alanı

## Monitoring
- `lib/monitoring/` — `captureException`, `captureMessage`, `setUser`, `setTag`, `setContext`
- `SENTRY_DSN` tanımlıysa adapter structured log yolunu etkinleştirir (`@sentry/nextjs` SDK zorunlu değil)
- SDK kurulumu: production'da `SENTRY_DSN` env + isteğe bağlı `@sentry/nextjs` paketi; DSN yoksa tam no-op
- PII (email, telefon, cookie, token) gönderilmez

## Email outbox
- `EmailOutbox` modeli — başarısız SMTP gönderimleri retry kuyruğu
- Cron: `POST /api/cron/email-outbox` (`CRON_SECRET`)
- Env: `EMAIL_OUTBOX_BATCH_SIZE`, `EMAIL_OUTBOX_MAX_ATTEMPTS`, `EMAIL_OUTBOX_RETRY_MINUTES`

## Health
- `GET /api/health` — hafif liveness
- `GET /api/readiness` — DB, Redis, upload, mail, env, monitoring

## Admin
- `/admin/system` — operasyonel özet (secret gösterilmez)
