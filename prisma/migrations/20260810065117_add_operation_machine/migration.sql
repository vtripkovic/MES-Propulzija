/*
  Warnings:

  - You are about to drop the column `machineId` on the `Operation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[routingId,sequence]` on the table `Operation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,revision]` on the table `Routing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Operation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Operation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Routing` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Operation" DROP CONSTRAINT "Operation_machineId_fkey";

-- AlterTable
ALTER TABLE "Operation" DROP COLUMN "machineId",
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Routing" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "OperationMachine" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationMachine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationMachine_operationId_machineId_key" ON "OperationMachine"("operationId", "machineId");

-- CreateIndex
CREATE UNIQUE INDEX "Operation_routingId_sequence_key" ON "Operation"("routingId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Routing_productId_revision_key" ON "Routing"("productId", "revision");

-- AddForeignKey
ALTER TABLE "OperationMachine" ADD CONSTRAINT "OperationMachine_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationMachine" ADD CONSTRAINT "OperationMachine_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
