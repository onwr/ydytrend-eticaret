# YDY Trend — Backup ve Restore

## Veritabanı
- Günlük otomatik MariaDB dump (VPS cron — operasyonel)
- Dump dosyaları şifreli depoda, retention 30 gün önerilir
- Restore: boş DB oluştur → `mysql < dump.sql` → `prisma migrate deploy` (gerekirse)

## Upload / CDN
- Görseller CDN'de; CDN sağlayıcı yedek politikası uygulanır
- Yerel `public/` yalnızca statik asset

## Ayarlar
- SMTP, banka, site ayarları DB `Setting` tablosunda — DB yedeği ile birlikte gelir

## Test restore
- Ayda bir staging/test ortamında restore drill önerilir
- Production restore yalnızca onaylı bakım penceresinde

Secret ve connection string backup raporlarına yazılmaz.
