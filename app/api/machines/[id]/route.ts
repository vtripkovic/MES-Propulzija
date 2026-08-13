import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const machine = await prisma.machine.findUnique({
      where: {
        id,
      },
      include: {
        department: true,

        operationMachines: {
          include: {
            operation: {
              include: {
                routing: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
          orderBy: {
            operation: {
              sequence: "asc",
            },
          },
        },

        operationExecutions: {
          include: {
            workOrder: {
              include: {
                product: true,
              },
            },
            operation: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
      },
    });

    if (!machine) {
      return NextResponse.json(
        {
          error: "Mašina nije pronađena",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(machine);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Greška pri učitavanju mašine",
      },
      {
        status: 500,
      },
    );
  }
}