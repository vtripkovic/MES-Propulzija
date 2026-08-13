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

    const workOrder = await prisma.workOrder.findUnique({
      where: {
        id,
      },
      include: {
        product: true,
        operations: {
          include: {
            operation: {
              include: {
                machines: {
                  include: {
                    machine: {
                      include: {
                        department: true,
                      },
                    },
                  },
                },
              },
            },
            machine: true,
          },
          orderBy: {
            operation: {
              sequence: "asc",
            },
          },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        {
          error: "Work order not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch work order",
      },
      {
        status: 500,
      },
    );
  }
}