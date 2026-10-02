import { NextResponse } from "next/server";
import { authorizeApi } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const auth = await authorizeApi(true);
  if (auth.response) return auth.response;
  try {
    const { id } = await context.params;

    const executions = await prisma.operationExecution.findMany({
      where: {
        workOrderId: id,
      },
      select: {
        status: true,
      },
    });

    if (executions.length === 0) {
      return NextResponse.json(
        {
          error: "Radni nalog nema izvršenja operacija, status nije moguće promeniti",
        },
        {
          status: 400,
        },
      );
    }

    const allCompleted = executions.every(
      (execution) => execution.status === "COMPLETED",
    );

    const anyStarted = executions.some(
      (execution) =>
        execution.status === "RUNNING" ||
        execution.status === "COMPLETED",
    );

    let status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";

    if (allCompleted) {
      status = "COMPLETED";
    } else if (anyStarted) {
      status = "IN_PROGRESS";
    } else {
      status = "PLANNED";
    }

    const workOrder = await prisma.workOrder.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Status radnog naloga nije moguće promeniti",
      },
      {
        status: 500,
      },
    );
  }
}