/*
  Warnings:

  - You are about to drop the column `unitPrice` on the `CartItem` table. All the data in the column will be lost.
  - Added the required column `priceAtAdd` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CartItem` DROP COLUMN `unitPrice`,
    ADD COLUMN `priceAtAdd` DECIMAL(10, 2) NOT NULL;
