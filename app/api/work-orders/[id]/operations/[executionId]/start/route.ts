import { NextRequest, NextResponse } from "next/server";
import { startOperation } from "@/app/services/workOrders/workOrderService";
import { authorizeApi } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

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
  const auth = await authorizeApi();
  if (auth.response) return auth.response;
  try {
    const { id, executionId } = await context.params;

    const body = await request.json();

    const machineId =
      typeof body.machineId === "string" &&
      body.machineId.trim() !== ""
        ? body.machineId
        : undefined;

    const existing = await prisma.operationExecution.findUnique({
      where: { id: executionId },
      include: {
        operation: {
          include: {
            machines: { include: { machine: true } },
          },
        },
      },
    });
    if (!existing || existing.workOrderId !== id) {
      return NextResponse.json(
        { error: "Operacija ne pripada ovom radnom nalogu" },
        { status: 404 },
      );
    }
    if (auth.user.role !== "ADMIN") {
      const departmentId = auth.user.department?.id;
      if (
        !departmentId ||
        !machineId ||
        !existing.operation.machines.some(
          (assignment) =>
            assignment.machineId === machineId &&
            assignment.machine.departmentId === departmentId,
        )
      ) {
        return NextResponse.json(
          { error: "Možete pokretati samo operacije na mašinama svog sektora." },
          { status: 403 },
        );
      }
    }

    const execution = await startOperation(
      executionId,
      machineId,
    );

    return NextResponse.json(execution);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Operaciju nije moguće pokrenuti",
      },
      {
        status: 400,
      },
    );
  }
}