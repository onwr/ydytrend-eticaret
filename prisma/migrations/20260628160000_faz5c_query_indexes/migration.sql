-- Faz 5C: sorgu performansı için additive indexler
CREATE INDEX `Order_status_createdAt_idx` ON `Order`(`status`, `createdAt`);
CREATE INDEX `AdminActivity_resource_createdAt_idx` ON `AdminActivity`(`resourceType`, `resourceId`, `createdAt`);
