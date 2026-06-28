-- Faz 4: Sipariş sonrası, iade/değişim, newsletter (additive)

-- StockMovementType enum extension
ALTER TABLE `StockMovement` MODIFY `type` ENUM('IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'CANCELLATION_RESTORE', 'EXCHANGE_IN', 'EXCHANGE_OUT') NOT NULL;

-- Product discount percentage
ALTER TABLE `Product` ADD COLUMN `discountPercentage` DECIMAL(5, 2) NULL;

-- ProductVariant imageUrl
ALTER TABLE `ProductVariant` ADD COLUMN `imageUrl` VARCHAR(500) NULL;

-- Order cancel/stock restore tracking
ALTER TABLE `Order` ADD COLUMN `cancelledAt` DATETIME(3) NULL;
ALTER TABLE `Order` ADD COLUMN `stockRestoredAt` DATETIME(3) NULL;

-- StockMovement orderId
ALTER TABLE `StockMovement` ADD COLUMN `orderId` INT NULL;
CREATE INDEX `StockMovement_orderId_createdAt_idx` ON `StockMovement`(`orderId`, `createdAt`);

-- Shipment extensions (drop unique on trackingNo if exists - may allow duplicates across carriers)
ALTER TABLE `Shipment` ADD COLUMN `trackingUrl` VARCHAR(500) NULL;
ALTER TABLE `Shipment` ADD COLUMN `estimatedDeliveryDate` DATETIME(3) NULL;
ALTER TABLE `Shipment` DROP INDEX `Shipment_trackingNo_key`;

-- New enums via tables
CREATE TABLE `OrderStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `previousStatus` ENUM('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NULL,
    `newStatus` ENUM('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL,
    `note` VARCHAR(500) NULL,
    `source` ENUM('CUSTOMER', 'ADMIN', 'SYSTEM') NOT NULL,
    `changedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `OrderStatusHistory_orderId_createdAt_idx`(`orderId`, `createdAt`),
    CONSTRAINT `OrderStatusHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReturnRequestCounter` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `year` INTEGER NOT NULL,
    `lastNumber` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ReturnRequestCounter` (`id`, `year`, `lastNumber`) VALUES (1, YEAR(CURRENT_DATE()), 0);

CREATE TABLE `ReturnRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestNumber` VARCHAR(32) NOT NULL,
    `orderId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `type` ENUM('RETURN', 'EXCHANGE', 'CANCELLATION') NOT NULL,
    `status` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAITING_FOR_PRODUCT', 'PRODUCT_RECEIVED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `reason` VARCHAR(120) NOT NULL,
    `customerNote` TEXT NULL,
    `adminNote` TEXT NULL,
    `refundStatus` ENUM('NOT_REQUIRED', 'PENDING', 'MANUAL_PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'NOT_REQUIRED',
    `refundAmount` DECIMAL(10, 2) NULL,
    `refundMethod` VARCHAR(80) NULL,
    `refundReference` VARCHAR(120) NULL,
    `refundedAt` DATETIME(3) NULL,
    `refundNote` TEXT NULL,
    `packageOpened` BOOLEAN NULL,
    `productUsed` BOOLEAN NULL,
    `stockRestoredAt` DATETIME(3) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ReturnRequest_requestNumber_key`(`requestNumber`),
    INDEX `ReturnRequest_orderId_idx`(`orderId`),
    INDEX `ReturnRequest_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `ReturnRequest_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReturnRequest_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `ReturnRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReturnRequestItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `returnRequestId` INTEGER NOT NULL,
    `orderItemId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `requestedVariantId` INTEGER NULL,
    `requestedVariantSnapshotJson` TEXT NULL,
    `reason` VARCHAR(120) NULL,
    `condition` ENUM('SELLABLE', 'DAMAGED', 'NEEDS_INSPECTION') NULL,
    `resolution` ENUM('REFUND', 'EXCHANGE', 'STORE_CREDIT') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReturnRequestItem_returnRequestId_idx`(`returnRequestId`),
    INDEX `ReturnRequestItem_orderItemId_idx`(`orderItemId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReturnRequestItem_returnRequestId_fkey` FOREIGN KEY (`returnRequestId`) REFERENCES `ReturnRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ReturnRequestItem_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReturnAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `returnRequestId` INTEGER NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(120) NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReturnAttachment_returnRequestId_idx`(`returnRequestId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ReturnAttachment_returnRequestId_fkey` FOREIGN KEY (`returnRequestId`) REFERENCES `ReturnRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NewsletterSubscriber` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED') NOT NULL DEFAULT 'PENDING',
    `source` VARCHAR(80) NOT NULL DEFAULT 'homepage',
    `consentAt` DATETIME(3) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `unsubscribedAt` DATETIME(3) NULL,
    `unsubscribeToken` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `NewsletterSubscriber_email_key`(`email`),
    UNIQUE INDEX `NewsletterSubscriber_unsubscribeToken_key`(`unsubscribeToken`),
    INDEX `NewsletterSubscriber_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
