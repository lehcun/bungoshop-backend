/*
  Warnings:

  - The values [CARD,WALLET,TRANSFER] on the enum `Payment_method` will be removed. If these variants are still used in the database, this will fail.
  - The values [CARD,WALLET,TRANSFER] on the enum `Payment_method` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Order` MODIFY `paymentMethod` ENUM('VNPay', 'MOMO', 'ATM', 'COD') NULL;

-- AlterTable
ALTER TABLE `Payment` MODIFY `method` ENUM('VNPay', 'MOMO', 'ATM', 'COD') NOT NULL;
