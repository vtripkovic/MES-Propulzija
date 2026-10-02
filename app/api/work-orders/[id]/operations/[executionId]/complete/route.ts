import { NextResponse } from "next/server";
import { completeOperation } from "@/app/services/workOrders/workOrderService";
import { authorizeApi } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

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
  const auth = await authorizeApi();
  if (auth.response) return auth.response;
  try {
    const { id, executionId } = await context.params;

    const existing = await prisma.operationExecution.findUnique({
      where: { id: executionId },
      include: { machine: true },
    });
    if (!existing || existing.workOrderId !== id) {
      return NextResponse.json(
        { error: "Operacija ne pripada ovom radnom nalogu" },
        { status: 404 },
      );
    }
    if (
      auth.user.role !== "ADMIN" &&
      (!auth.user.department?.id ||
        existing.machine?.departmentId !== auth.user.department.id)
    ) {
      return NextResponse.json(
        { error: "Možete završavati samo operacije svog sektora." },
        { status: 403 },
      );
    }

    const execution = await completeOperation(executionId);

    return NextResponse.json(execution);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Operaciju nije moguće završiti",
      },
      {
        status: 400,
      },
    );
  }
}