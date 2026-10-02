ALTER TABLE "OperationExecution"
ADD COLUMN "executionOrder" INTEGER;

WITH RECURSIVE item_siblings AS (
  SELECT
    "id",
    "parentItemId",
    "workOrderId",
    ROW_NUMBER() OVER (
      PARTITION BY "workOrderId", "parentItemId"
      ORDER BY "createdAt" ASC, "id" ASC
    )::INTEGER AS sibling_order
  FROM "WorkOrderItem"
),
item_paths AS (
  SELECT
    item."id",
    item."workOrderId",
    item."parentItemId",
    0 AS depth,
    ARRAY[]::INTEGER[] AS path
  FROM "WorkOrderItem" item
  WHERE item."parentItemId" IS NULL

  UNION ALL

  SELECT
    child."id",
    child."workOrderId",
    child."parentItemId",
    parent.depth + 1,
    parent.path || child.sibling_order
  FROM item_siblings child
  JOIN item_paths parent ON child."parentItemId" = parent."id"
),
ordered_executions AS (
  SELECT
    execution."id",
    ROW_NUMBER() OVER (
      PARTITION BY execution."workOrderId"
      ORDER BY
        COALESCE(
          item_paths.path || ARRAY[2147483647]::INTEGER[],
          ARRAY[2147483647]::INTEGER[]
        ) ASC,
        operation."sequence" ASC,
        execution."createdAt" ASC,
        execution."id" ASC
    ) - 1 AS execution_order
  FROM "OperationExecution" execution
  LEFT JOIN "WorkOrderItem" item
    ON item."id" = execution."workOrderItemId"
  LEFT JOIN item_paths
    ON item_paths."id" = item."id"
  JOIN "Operation" operation
    ON operation."id" = execution."operationId"
)
UPDATE "OperationExecution" execution
SET "executionOrder" = ordered_executions.execution_order::INTEGER
FROM ordered_executions
WHERE execution."id" = ordered_executions."id";

ALTER TABLE "OperationExecution"
ALTER COLUMN "executionOrder" SET NOT NULL;

CREATE UNIQUE INDEX "OperationExecution_workOrderId_executionOrder_key"
ON "OperationExecution"("workOrderId", "executionOrder");
