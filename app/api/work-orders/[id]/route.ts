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

        // Sve operacije radnog naloga
        // zadržavamo zbog postojećeg izračunavanja statusa/progress-a
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

        // Hijerarhijska struktura radnog naloga
        items: {
          include: {
            product: true,

            parentItem: {
              include: {
                product: true,
              },
            },

            childItems: {
              include: {
                product: true,
              },
            },

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

          orderBy: {
            createdAt: "asc",
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

export async function DELETE(
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
        operations: {
          select: {
            id: true,
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

    await prisma.$transaction(async (tx) => {
      // Prvo brišemo izvršenja operacija
      await tx.operationExecution.deleteMany({
        where: {
          workOrderId: id,
        },
      });

      // Zatim brišemo radni nalog
      await tx.workOrder.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Work order "${workOrder.number}" deleted successfully.`,
    });
  } catch (error) {
    console.error("WORK ORDER DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete work order",
      },
      {
        status: 500,
      },
    );
  }
}