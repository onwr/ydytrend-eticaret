-- Hero slider: metin, buton ve özellik alanları (yalnızca eksik sütunlar)
SET @db := DATABASE();

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Slider' AND COLUMN_NAME='badgeText');
SET @sql := IF(@c=0, 'ALTER TABLE `Slider` ADD COLUMN `badgeText` VARCHAR(200) NULL AFTER `id`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Slider' AND COLUMN_NAME='buttonLink');
SET @sql := IF(@c=0, 'ALTER TABLE `Slider` ADD COLUMN `buttonLink` VARCHAR(500) NULL AFTER `buttonText`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Slider' AND COLUMN_NAME='button2Text');
SET @sql := IF(@c=0, 'ALTER TABLE `Slider` ADD COLUMN `button2Text` VARCHAR(120) NULL AFTER `buttonLink`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Slider' AND COLUMN_NAME='button2Link');
SET @sql := IF(@c=0, 'ALTER TABLE `Slider` ADD COLUMN `button2Link` VARCHAR(500) NULL AFTER `button2Text`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='Slider' AND COLUMN_NAME='featuresJson');
SET @sql := IF(@c=0, 'ALTER TABLE `Slider` ADD COLUMN `featuresJson` TEXT NULL AFTER `button2Link`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
