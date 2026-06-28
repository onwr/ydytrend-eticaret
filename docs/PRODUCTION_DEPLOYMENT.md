# YDY Trend — Production Deployment

## Ön koşullar
- Node.js 20+
- MariaDB, opsiyonel Redis
- Reverse proxy (nginx) + `TRUST_PROXY=1`

## Build
```bash
npm ci
npx prisma generate
npm run build
```

## Env (production)
- `NODE_ENV=production`
- `JWT_SECRET` ≥ 32 karakter
- `NEXT_PUBLIC_SITE_URL` — canlı domain, localhost yasak
- `ALLOW_INDEXING=true`
- `CRON_SECRET`, `REDIS_URL` (önerilir)

## Migration
- Production migration ayrı bakım penceresinde
- Test/staging: `npx prisma migrate deploy` (test DB URL ile)

## Start
```bash
npm run start
```

## Smoke
- `/api/health`, `/api/readiness`
- Ana sayfa, ürün, checkout (test sipariş)

Git işlemi ve VPS adımları operasyon ekibine aittir; bu repo deploy script içermez.
