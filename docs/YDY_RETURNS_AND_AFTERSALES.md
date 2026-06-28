# YDY Trend — İade, Değişim ve Sipariş Sonrası

## Order lifecycle

Mevcut `OrderStatus` enum değerleri korunur:

| Enum | Müşteri etiketi |
|------|-----------------|
| PENDING | Sipariş Alındı |
| PAID | Onaylandı |
| PROCESSING | Hazırlanıyor |
| SHIPPED | Kargoya Verildi |
| DELIVERED | Teslim Edildi |
| CANCELLED | İptal Edildi |
| REFUNDED | İade Tamamlandı |

Geçiş kuralları: `lib/orderStatusTransitions.ts`.

Her durum değişikliği `OrderStatusHistory` tablosuna yazılır.

## Cancellation rules

Müşteri iptali: `POST /api/orders/[orderNo]/cancel`

- İzin verilen durumlar: PENDING, PAID, PROCESSING
- Stok geri yükleme: `restoreOrderStock` (idempotent, `Order.stockRestoredAt`)
- BANK_TRANSFER otomatik iade yok; `cancel_manual_refund_pending` e-postası

## Return transition matrix

Merkezi helper: `lib/returnStatusTransitions.ts`

| From | Allowed |
|------|---------|
| PENDING | UNDER_REVIEW, APPROVED, REJECTED, CANCELLED |
| UNDER_REVIEW | APPROVED, REJECTED, CANCELLED |
| APPROVED | WAITING_FOR_PRODUCT |
| WAITING_FOR_PRODUCT | PRODUCT_RECEIVED |
| PRODUCT_RECEIVED | COMPLETED |
| REJECTED / COMPLETED / CANCELLED | (terminal) |

Müşteri iptali: `POST /api/returns/[requestNumber]` — yalnızca PENDING, UNDER_REVIEW.

Admin aksiyonları: `review`, `approve`, `reject`, `product_received`, `complete`.

## Stock idempotency

- Sipariş iptali: `Order.stockRestoredAt`
- İade/değişim tamamlama: `ReturnRequest.stockRestoredAt` + `processReturnStockOnComplete`
- Hasarlı ürün stoğa eklenmez (`ReturnItemCondition.DAMAGED`)
- Değişim: `EXCHANGE_IN` (eski) + `EXCHANGE_OUT` (yeni varyant)

## Admin shipment form

- UI: `components/admin/AdminShipmentForm.tsx` — admin sipariş detayında
- API: `PATCH /api/admin/orders/[orderNo]/shipment`
- Takip URL: yalnızca http/https (`lib/trackingUrlValidation.ts`)
- `markShipped` / `markDelivered` durum geçişi tetikler
- E-posta: `order_shipped`, `order_delivered` (`lib/emails/afterSalesEmails.ts`)

## Financial refund admin flow

Admin return detay UI + `PATCH` action `update_refund`:

- refundStatus, refundAmount, refundMethod, refundReference, refundedAt, refundNote
- BANK_TRANSFER manuel; tutar ≥ 0, kalem toplamını aşamaz
- COMPLETED iade tekrar işlenemez
- Audit log referans maskelenir

## Email event matrix

Şablonlar: `lib/emails/afterSalesEmails.ts` (YDY Trend marka layout)

| Olay | Event key |
|------|-----------|
| Sipariş iptal | order_cancelled |
| Havale iptal bekleme | cancel_manual_refund_pending |
| İade talebi | return_received |
| İnceleme | return_under_review |
| İade onay | return_approved |
| İade red | return_rejected |
| Ürün alındı | return_product_received |
| İade tamam | return_completed |
| Değişim talebi/onay/red/tamam | exchange_* |
| Kargoya verildi / teslim | order_shipped / order_delivered |

Mail hatası ana transaction'ı rollback etmez (`after()` + try/catch).

## Varyant görseli

- Alan: `ProductVariant.imageUrl`
- Admin: ürün yeni/düzenle formları, galeriden seçim
- Storefront: `lib/variantGalleryImage.ts`
- Doğrulama: `lib/variantImageUrlValidation.ts`

## Upload security

`lib/returnUpload.ts` — JPG/PNG/WebP, max 5 MB, max 5 dosya, dosya adı normalize, path traversal reddi.

## Newsletter lifecycle

Model: `NewsletterSubscriber` — PENDING, ACTIVE, UNSUBSCRIBED, BOUNCED.

API: subscribe (honeypot, rate limit, email normalize), unsubscribe token (UUID).

## Runtime test komutları

```bash
npm run test:helpers
npx tsx scripts/run-phase2e-runtime-tests.ts
npx tsx scripts/run-phase4b-runtime-tests.ts
npx tsx scripts/setup-runtime-test-db.ts   # test DB migration
npx prisma validate
npm run build
```

## Known limitations

- Otomatik PayTR/kart iadesi yok
- BANK_TRANSFER finans iadeleri manuel
- Double opt-in newsletter opsiyonel
- Production migration bu fazda uygulanmadı
