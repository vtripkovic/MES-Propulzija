import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    operationId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { operationId } = await context.params;

    const operationMachines =
      await prisma.operationMachine.findMany({
        where: {
          operationId,
        },
        include: {
          machine: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          machine: {
            name: "asc",
          },
        },
      });

    const machines = operationMachines.map(
      (operationMachine) => operationMachine.machine,
    );

    return NextResponse.json(machines);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Greška pri učitavanju dozvoljenih mašina",
      },
      {
        status: 500,
      },
    );
  }
}