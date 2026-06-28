# YDY Trend — SEO ve Analytics

## SEO
- `lib/seo/` — canonical, noindex, product/category metadata
- Root `generateMetadata`: metadataBase, OG, Twitter, manifest
- JSON-LD: `lib/jsonLd.ts`, `components/seo/JsonLd.tsx`
- Sahte rating üretilmez; fiyat/stok storefront ile aynı kaynaktan

## Indexing
- `ALLOW_INDEXING=true|false` — production açık, staging/test kapalı
- `app/robots.ts`, `app/sitemap.ts`
- Noindex: search, cart, checkout, auth, profil, sipariş, admin

## Analytics
- `lib/analytics/events.ts` — GA4 / Meta / TikTok event köprüsü
- Env yoksa script yüklenmez
- Purchase: `lib/analytics/purchaseDedupe.ts` — orderId başına bir kez

## Cookie consent
- `components/consent/CookieConsent.tsx` — Necessary / Analytics / Marketing
- İzin verilmeden analytics/marketing scriptleri yüklenmez
- Footer: Çerez Tercihleri

## Env
```
ALLOW_INDEXING=true
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
```
