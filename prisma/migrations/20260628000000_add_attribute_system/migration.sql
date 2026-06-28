-- Faz 2: Yapılandırılmış Özellik ve Varyant Sistemi
-- NON-DESTRUCTIVE: Yalnızca yeni tablo/kolon/index eklenir, mevcut hiçbir şey değiştirilmez.

-- ── Attribute ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Attribute` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(191) NOT NULL,
  `slug`         VARCHAR(191) NOT NULL,
  `type`         ENUM('SELECT','COLOR','SIZE','MATERIAL','TEXT') NOT NULL DEFAULT 'SELECT',
  `isVariant`    TINYINT(1)   NOT NULL DEFAULT 1,
  `isFilterable` TINYINT(1)   NOT NULL DEFAULT 0,
  `isRequired`   TINYINT(1)   NOT NULL DEFAULT 0,
  `isActive`     TINYINT(1)   NOT NULL DEFAULT 1,
  `sortOrder`    INT          NOT NULL DEFAULT 0,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Attribute_slug_key` (`slug`),
  KEY `Attribute_isActive_sortOrder_idx` (`isActive`, `sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── AttributeValue ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `AttributeValue` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `attributeId` INT          NOT NULL,
  `value`       VARCHAR(191) NOT NULL,
  `slug`        VARCHAR(191) NOT NULL,
  `colorHex`    VARCHAR(7)   NULL,
  `imageUrl`    VARCHAR(500) NULL,
  `sortOrder`   INT          NOT NULL DEFAULT 0,
  `isActive`    TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `AttributeValue_attributeId_slug_key` (`attributeId`, `slug`),
  KEY `AttributeValue_attributeId_isActive_sortOrder_idx` (`attributeId`, `isActive`, `sortOrder`),
  CONSTRAINT `AttributeValue_attributeId_fkey`
    FOREIGN KEY (`attributeId`) REFERENCES `Attribute` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CategoryAttribute ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `CategoryAttribute` (
  `categoryId`   INT        NOT NULL,
  `attributeId`  INT        NOT NULL,
  `isRequired`   TINYINT(1) NOT NULL DEFAULT 0,
  `isVariant`    TINYINT(1) NOT NULL DEFAULT 1,
  `isFilterable` TINYINT(1) NOT NULL DEFAULT 0,
  `sortOrder`    INT        NOT NULL DEFAULT 0,
  PRIMARY KEY (`categoryId`, `attributeId`),
  KEY `CategoryAttribute_categoryId_idx` (`categoryId`),
  CONSTRAINT `CategoryAttribute_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CategoryAttribute_attributeId_fkey`
    FOREIGN KEY (`attributeId`) REFERENCES `Attribute` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ProductAttributeValue ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ProductAttributeValue` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `productId`   INT NOT NULL,
  `attributeId` INT NOT NULL,
  `valueId`     INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductAttributeValue_productId_attributeId_key` (`productId`, `attributeId`),
  KEY `ProductAttributeValue_productId_idx` (`productId`),
  KEY `ProductAttributeValue_attributeId_idx` (`attributeId`),
  KEY `ProductAttributeValue_valueId_idx` (`valueId`),
  CONSTRAINT `ProductAttributeValue_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProductAttributeValue_attributeId_fkey`
    FOREIGN KEY (`attributeId`) REFERENCES `Attribute` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProductAttributeValue_valueId_fkey`
    FOREIGN KEY (`valueId`) REFERENCES `AttributeValue` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ProductVariantAttributeValue ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ProductVariantAttributeValue` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `variantId`   INT NOT NULL,
  `attributeId` INT NOT NULL,
  `valueId`     INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductVariantAttributeValue_variantId_attributeId_key` (`variantId`, `attributeId`),
  KEY `ProductVariantAttributeValue_variantId_idx` (`variantId`),
  KEY `ProductVariantAttributeValue_attributeId_idx` (`attributeId`),
  KEY `ProductVariantAttributeValue_valueId_idx` (`valueId`),
  CONSTRAINT `ProductVariantAttributeValue_variantId_fkey`
    FOREIGN KEY (`variantId`) REFERENCES `ProductVariant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProductVariantAttributeValue_attributeId_fkey`
    FOREIGN KEY (`attributeId`) REFERENCES `Attribute` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProductVariantAttributeValue_valueId_fkey`
    FOREIGN KEY (`valueId`) REFERENCES `AttributeValue` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── OrderItem: varyant snapshot alanları (additive, nullable) ─────────────
-- Mevcut siparişler etkilenmez; sütunlar NULL kabul eder.
ALTER TABLE `OrderItem`
  ADD COLUMN IF NOT EXISTS `variantName`         VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `variantSku`          VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS `variantSnapshotJson` TEXT         NULL;

-- ── ProductVariant: combinationKey kolonu + unique index ───────────────────
-- combinationKey: "attrId1:valId1|attrId2:valId2" (attributeId'ye göre sıralı)
-- NULL değerler duplicate olabilir (varyantsız ürünler); non-NULL değerler ürün bazında benzersiz.
ALTER TABLE `ProductVariant`
  ADD COLUMN IF NOT EXISTS `combinationKey` VARCHAR(500) NULL;

-- MySQL'de NULL-safe unique için partial unique index yerine sadece standard unique kullan;
-- MySQL NULLları unique kısıtlamada birden fazla NULL'a izin verir.
ALTER TABLE `ProductVariant`
  ADD UNIQUE KEY IF NOT EXISTS `ProductVariant_productId_combinationKey_key` (`productId`, `combinationKey`);
