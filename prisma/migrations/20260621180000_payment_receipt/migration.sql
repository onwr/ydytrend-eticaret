-- Havale dekont alanları (yalnızca eksik sütunlar)
SET @db := DATABASE();

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Payment' AND COLUMN_NAME='receiptUrl');
SET @sql := IF(@c=0, 'ALTER TABLE `Payment` ADD COLUMN `receiptUrl` VARCHAR(500) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Payment' AND COLUMN_NAME='receiptFileName');
SET @sql := IF(@c=0, 'ALTER TABLE `Payment` ADD COLUMN `receiptFileName` VARCHAR(255) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Payment' AND COLUMN_NAME='receiptMimeType');
SET @sql := IF(@c=0, 'ALTER TABLE `Payment` ADD COLUMN `receiptMimeType` VARCHAR(120) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Payment' AND COLUMN_NAME='receiptUploadedAt');
SET @sql := IF(@c=0, 'ALTER TABLE `Payment` ADD COLUMN `receiptUploadedAt` DATETIME(3) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
