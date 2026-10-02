UPDATE "OperationExecution"
SET "status" = 'WAITING'
WHERE "status" = 'READY';
