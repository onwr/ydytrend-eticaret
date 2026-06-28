# YDY Trend — Operations Runbook

## Günlük kontroller
1. `GET /api/health` — 200
2. `GET /api/readiness` — status ok veya degraded (redis opsiyonel)
3. Admin `/admin/system` — cron, mail, DB özeti

## Cron
- `POST /api/cron/maintenance` — `Authorization: Bearer $CRON_SECRET` veya `x-cron-secret`
- Görevler: süresi dolmuş password reset token, eski guest cart (90 gün)
- Idempotent, batch limit 500, in-process lock

## Log inceleme
- Structured JSON log — `requestId` ile API hata eşleştirme
- Admin audit: `/admin/activity-log`

## Incident
1. Readiness hangi check fail?
2. DB bağlantı / migration durumu
3. Redis yoksa rate limit memory fallback (tek instance uyarısı)
4. SMTP admin panelden doğrula

## Test DB migration checksum
```bash
# DATABASE_URL yalnızca ydytrend_runtime_test veya ydytrend_legacy_test
npm run audit:migrations:test-db
```
