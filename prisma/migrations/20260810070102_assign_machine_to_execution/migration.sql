-- AlterTable
ALTER TABLE "OperationExecution" ADD COLUMN     "machineId" TEXT;

-- AddForeignKey
ALTER TABLE "OperationExecution" ADD CONSTRAINT "OperationExecution_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
