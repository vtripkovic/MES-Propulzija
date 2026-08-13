/*
  Warnings:

  - A unique constraint covering the columns `[parentId,childId]` on the table `BOMItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BOMItem_parentId_childId_key" ON "BOMItem"("parentId", "childId");
