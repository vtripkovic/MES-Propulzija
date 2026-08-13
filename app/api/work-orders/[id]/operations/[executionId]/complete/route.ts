import { NextResponse } from "next/server";
import { completeOperation } from "@/app/services/workOrders/workOrderService";

type RouteContext = {
  params: Promise<{
    id: string;
    executionId: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id, executionId } = await context.params;

    const execution = await completeOperation(executionId);

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
            : "Failed to complete operation",
      },
      {
        status: 400,
      },
    );
  }
}