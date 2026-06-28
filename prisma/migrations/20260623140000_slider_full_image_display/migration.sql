-- Full image hero: mobil görsel ve object-position
SET @db := DATABASE();

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Slider' AND COLUMN_NAME='mobileImageUrl');
SET @sql := IF(@c=0, 'ALTER TABLE `Slider` ADD COLUMN `mobileImageUrl` VARCHAR(500) NULL AFTER `imageUrl`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Slider' AND COLUMN_NAME='imageObjectPosition');
SET @sql := IF(@c=0, 'ALTER TABLE `Slider` ADD COLUMN `imageObjectPosition` VARCHAR(50) NULL DEFAULT ''center'' AFTER `mobileImageUrl`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
