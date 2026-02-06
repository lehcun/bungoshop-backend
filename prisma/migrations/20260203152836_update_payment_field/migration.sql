/*
  Warnings:

  - You are about to drop the column `provider` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `provider`,
    MODIFY `currency` VARCHAR(191) NOT NULL DEFAULT 'VND';
