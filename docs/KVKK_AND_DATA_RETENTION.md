# YDY Trend — KVKK ve Veri Saklama

## Kişisel veri
- Hesap: email, telefon, adres (sipariş snapshot)
- Newsletter: email + consent timestamp
- Log/audit: email maskeli, tam adres loglanmaz

## Saklama (önerilen)
| Veri | Süre |
|------|------|
| Sipariş kayıtları | Yasal zorunluluk (10 yıl muhasebe) |
| Password reset token | 7 gün (cron temizler) |
| Guest cart | 90 gün inaktif (cron temizler) |
| Return attachment | İade tamamlandıktan sonra 24 ay |
| Admin audit | 24 ay (arşiv/export) |
| Newsletter unsubscribed | 3 yıl sonra anonimleştirme planı |

## Haklar
- Abonelik iptali: `/api/newsletter/unsubscribe`
- Hesap silme: admin prosedürü + anonimleştirme (planlı)

## CSV export
- Newsletter export admin-only, audit loglanır
- CSV injection için hücre escape uygulanır

## Çerez
- Zorunlu / Analitik / Pazarlama — consent banner
- Analytics PII göndermez

Operasyonel uygulama VPS/cron ile tamamlanır; production DB'ye bu fazda dokunulmaz.
