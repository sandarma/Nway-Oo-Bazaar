-- AlterTable
ALTER TABLE `events` ADD COLUMN `organizerId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_organizerId_fkey` FOREIGN KEY (`organizerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX `invitations_usedBy_key` ON `invitations`(`usedBy`);
