/*
  Warnings:

  - Added the required column `discountType` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Made the column `discountAmount` on table `Promotion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Promotion` ADD COLUMN `discountType` ENUM('PERCENT', 'AMOUNT') NOT NULL,
    MODIFY `discountAmount` INTEGER NOT NULL;
