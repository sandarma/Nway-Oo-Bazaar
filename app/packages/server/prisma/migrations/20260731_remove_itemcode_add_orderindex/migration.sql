-- AlterTable: Remove itemCode, add orderIndex, change unique constraint
ALTER TABLE `menu_items` DROP COLUMN `itemCode`;
ALTER TABLE `menu_items` ADD COLUMN `orderIndex` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `menu_items` DROP INDEX `menu_items_eventId_itemCode_key`;
ALTER TABLE `menu_items` ADD UNIQUE INDEX `menu_items_eventId_name_key`(`eventId`, `name`);
