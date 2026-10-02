import { NextResponse } from "next/server";
import { authorizeApi } from "@/app/lib/auth";
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
  const auth = await authorizeApi();
  if (auth.response) return auth.response;
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
            machine: {
              include: {
                department: true,
              },
            },
          },
          orderBy: { executionOrder: "asc" },
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
                machine: {
                  include: {
                    department: true,
                  },
                },
              },
              orderBy: { executionOrder: "asc" },
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
          error: "Radni nalog nije moguće pronaći",
        },
        {
          status: 404,
        },
      );
    }

    if (auth.user.role !== "ADMIN") {
      const departmentId = auth.user.department?.id;
      const scopedOperations = workOrder.operations.filter(
        (execution) =>
          execution.machine?.departmentId === departmentId ||
          (!execution.machine &&
            execution.operation.machines.some(
              (assignment) =>
                assignment.machine.departmentId === departmentId,
            )),
      );
      if (!scopedOperations.length) {
        return NextResponse.json(
          { error: "Radni nalog nije pronađen" },
          { status: 404 },
        );
      }
      workOrder.operations = scopedOperations.map((execution) => ({
        ...execution,
        operation: {
          ...execution.operation,
          machines: execution.operation.machines.filter(
            (assignment) =>
              assignment.machine.departmentId === departmentId,
          ),
        },
      }));
      workOrder.items = workOrder.items
        .filter((item) =>
          item.operations.some((execution) =>
            scopedOperations.some((scoped) => scoped.id === execution.id),
          ),
        )
        .map((item) => ({
          ...item,
          operations: item.operations.filter((execution) =>
            scopedOperations.some((scoped) => scoped.id === execution.id),
          ).map((execution) => ({
            ...execution,
            operation: {
              ...execution.operation,
              machines: execution.operation.machines.filter(
                (assignment) =>
                  assignment.machine.departmentId === departmentId,
              ),
            },
          })),
          parentItem: null,
          childItems: [],
        }));
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Radni nalog nije moguće pronaći",
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
  const auth = await authorizeApi(true);
  if (auth.response) return auth.response;
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
          error: "Radni nalog nije moguće pronaći",
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

      // WorkOrderItem has a restrictive foreign key to WorkOrder.
      await tx.workOrderItem.deleteMany({
        where: {
          workOrderId: id,
        },
      });

      // Delete the work order after all dependent records.
      await tx.workOrder.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Radni nalog "${workOrder.number}" uspešno obrisan.`,
    });
  } catch (error) {
    console.error("Greška kod brisanja radnog naloga:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Radni nalog nije moguće obrisati",
      },
      {
        status: 500,
      },
    );
  }
}