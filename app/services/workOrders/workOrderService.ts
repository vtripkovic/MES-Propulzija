import { prisma } from "@/app/lib/prisma";
import { canStartWorkOrderExecution } from "@/app/lib/work-order-operations";

async function updateWorkOrderStatus(workOrderId: string) {
  const executions = await prisma.operationExecution.findMany({
    where: {
      workOrderId,
    },
    select: {
      status: true,
    },
  });

  if (executions.length === 0) {
    return;
  }

  let status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";

  const allCompleted = executions.every(
    (execution) => execution.status === "COMPLETED",
  );

  const anyStarted = executions.some(
    (execution) =>
      execution.status === "RUNNING" ||
      execution.status === "COMPLETED",
  );

  if (allCompleted) {
    status = "COMPLETED";
  } else if (anyStarted) {
    status = "IN_PROGRESS";
  } else {
    status = "PLANNED";
  }

  await prisma.workOrder.update({
    where: {
      id: workOrderId,
    },
    data: {
      status,
    },
  });
}

export async function startOperation(
  executionId: string,
  machineId?: string,
) {
  const execution = await prisma.operationExecution.findUnique({
    where: {
      id: executionId,
    },
    include: {
      operation: true,
      workOrder: true,
    },
  });

  if (!execution) {
    throw new Error("Operation execution not found");
  }

  if (execution.status !== "WAITING") {
    throw new Error(
      `Operation cannot be started from status ${execution.status}`,
    );
  }

  const [executions, items] = await Promise.all([
    prisma.operationExecution.findMany({
      where: { workOrderId: execution.workOrderId },
      select: {
        id: true,
        workOrderItemId: true,
        executionOrder: true,
        status: true,
      },
    }),
    prisma.workOrderItem.findMany({
      where: { workOrderId: execution.workOrderId },
      select: { id: true, parentItemId: true },
    }),
  ]);
  const executionState = executions.find(
    (item) => item.id === executionId,
  );

  if (
    !executionState ||
    !canStartWorkOrderExecution(executionState, executions, items)
  ) {
    throw new Error(
      "Pre pokretanja operacije moraju biti završene prethodne operacije iste stavke i svih njenih delova",
    );
  }

  if (machineId) {
  const allowedMachine = await prisma.operationMachine.findUnique({
    where: {
      operationId_machineId: {
        operationId: execution.operationId,
        machineId,
      },
    },
  });

  if (!allowedMachine) {
    throw new Error(
      "Selected machine is not allowed for this operation",
    );
  }

  const machine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
  });

  if (!machine) {
    throw new Error("Machine not found");
  }
}

  const updatedExecution = await prisma.operationExecution.update({
  where: {
    id: executionId,
  },
  data: {
  machineId: machineId || null,
  status: "RUNNING",
  startedAt: new Date(),
},
  include: {
    operation: true,
    machine: true,
    workOrder: true,
  },
});

await updateWorkOrderStatus(execution.workOrderId);

return updatedExecution;
}

export async function completeOperation(
  executionId: string,
) {
  const execution = await prisma.operationExecution.findUnique({
  where: {
    id: executionId,
  },
  include: {
    operation: true,
  },
});

  if (!execution) {
    throw new Error("Operation execution not found");
  }

  if (execution.status !== "RUNNING") {
    throw new Error(
      `Operation cannot be completed from status ${execution.status}`,
    );
  }

  const finishedAt = new Date();

  const actualTime = execution.startedAt
    ? Math.round(
        (finishedAt.getTime() - execution.startedAt.getTime()) / 60000,
      )
    : null;

    const completedExecution = await prisma.operationExecution.update({
    where: {
      id: executionId,
    },
    data: {
      status: "COMPLETED",
      finishedAt,
      actualTime,
    },
    include: {
      operation: true,
      machine: true,
      workOrder: true,
    },
  });

  await updateWorkOrderStatus(execution.workOrderId);

  return completedExecution;
}
