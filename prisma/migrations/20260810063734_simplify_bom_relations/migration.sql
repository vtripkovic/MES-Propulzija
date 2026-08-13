/*
  Warnings:

  - You are about to drop the column `parentId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_parentId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "parentId";
