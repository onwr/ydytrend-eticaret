-- Güvenli hero stili sütunları (zaten varsa atla)
SET @db := DATABASE();

SET @has_hero_style := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Slider' AND COLUMN_NAME = 'heroStyle'
);
SET @sql := IF(
  @has_hero_style = 0,
  'ALTER TABLE `Slider` ADD COLUMN `heroStyle` VARCHAR(20) NOT NULL DEFAULT ''split'' AFTER `id`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_image_only_link := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Slider' AND COLUMN_NAME = 'imageOnlyLink'
);
SET @sql := IF(
  @has_image_only_link = 0,
  'ALTER TABLE `Slider` ADD COLUMN `imageOnlyLink` VARCHAR(500) NULL AFTER `linkUrl`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_image_only_tab := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Slider' AND COLUMN_NAME = 'imageOnlyOpenInNewTab'
);
SET @sql := IF(
  @has_image_only_tab = 0,
  'ALTER TABLE `Slider` ADD COLUMN `imageOnlyOpenInNewTab` BOOLEAN NOT NULL DEFAULT false AFTER `imageOnlyLink`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
