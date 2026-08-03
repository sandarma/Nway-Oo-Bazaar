-- Add new column first
ALTER TABLE `menu_items`
  ADD COLUMN `orderIndex` INTEGER NOT NULL DEFAULT 0;

-- Add a replacement index first so the FK still has support
ALTER TABLE `menu_items`
  ADD INDEX `menu_items_eventId_orderIndex_idx` (`eventId`, `orderIndex`);

-- Now it is safe to drop the old index
ALTER TABLE `menu_items`
  DROP INDEX `menu_items_eventId_itemCode_key`;

-- Then drop the old column
ALTER TABLE `menu_items`
  DROP COLUMN `itemCode`;