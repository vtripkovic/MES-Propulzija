import { NextRequest, NextResponse } from "next/server";
import { startOperation } from "@/app/services/workOrders/workOrderService";

type RouteContext = {
  params: Promise<{
    id: string;
    executionId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id, executionId } = await context.params;

    const body = await request.json();

    const machineId =
      typeof body.machineId === "string" &&
      body.machineId.trim() !== ""
        ? body.machineId
        : undefined;

    const execution = await startOperation(
      executionId,
      machineId,
    );

    if (execution.workOrderId !== id) {
      return NextResponse.json(
        {
          error: "Operation does not belong to this work order",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start operation",
      },
      {
        status: 400,
      },
    );
  }
}