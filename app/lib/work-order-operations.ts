export type WorkOrderExecutionDependency = {
  id: string;
  workOrderItemId: string | null;
  executionOrder: number;
  status: string;
};

export type WorkOrderItemDependency = {
  id: string;
  parentItemId: string | null;
};

export function canStartWorkOrderExecution(
  execution: WorkOrderExecutionDependency,
  executions: WorkOrderExecutionDependency[],
  items: WorkOrderItemDependency[],
) {
  if (execution.status !== "WAITING") {
    return false;
  }

  const parentByItemId = new Map(
    items.map((item) => [item.id, item.parentItemId]),
  );

  function isDescendantOf(
    itemId: string | null,
    ancestorItemId: string,
  ) {
    let parentItemId = itemId
      ? parentByItemId.get(itemId) ?? null
      : null;

    while (parentItemId) {
      if (parentItemId === ancestorItemId) {
        return true;
      }

      parentItemId = parentByItemId.get(parentItemId) ?? null;
    }

    return false;
  }

  return !executions.some((other) => {
    if (
      other.id === execution.id ||
      other.status === "COMPLETED"
    ) {
      return false;
    }

    const previousOnSameItem =
      other.workOrderItemId === execution.workOrderItemId &&
      other.executionOrder < execution.executionOrder;
    const unfinishedDescendant =
      execution.workOrderItemId !== null &&
      isDescendantOf(
        other.workOrderItemId,
        execution.workOrderItemId,
      );

    return previousOnSameItem || unfinishedDescendant;
  });
}
