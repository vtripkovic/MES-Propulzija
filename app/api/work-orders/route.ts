import { NextResponse } from "next/server";
import { authorizeApi } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type BomNode = {
  id: string;
  quantity: number;
  child: {
    id: string;
    code: string;
    name: string;
    revision: string;
  };
  children: BomNode[];
};

async function buildBom(
  productId: string,
  visited = new Set<string>(),
): Promise<BomNode[]> {
  if (visited.has(productId)) {
    throw new Error("Cyclic BOM structure detected");
  }

  const nextVisited = new Set(visited);
  nextVisited.add(productId);

  const items = await prisma.bOMItem.findMany({
    where: {
      parentId: productId,
    },
    include: {
      child: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const result: BomNode[] = [];

  for (const item of items) {
    const children = await buildBom(
      item.childId,
      nextVisited,
    );

    result.push({
      id: item.id,
      quantity: item.quantity,
      child: {
        id: item.child.id,
        code: item.child.code,
        name: item.child.name,
        revision: item.child.revision,
      },
      children,
    });
  }

  return result;
}

export async function GET(request: Request) {
  const auth = await authorizeApi();
  if (auth.response) return auth.response;
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const productId = searchParams.get("productId")?.trim() || "";

    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "10");

    const page =
      Number.isInteger(pageParam) && pageParam > 0
        ? pageParam
        : 1;

    const limit =
      Number.isInteger(limitParam) &&
      limitParam > 0 &&
      limitParam <= 100
        ? limitParam
        : 10;

    const where = {
      ...(auth.user.role === "ADMIN"
        ? {}
        : {
            operations: {
              some: {
                operation: {
                  machines: {
                    some: {
                      machine: {
                        departmentId: auth.user.department?.id ?? "__no_department__",
                      },
                    },
                  },
                },
              },
            },
          }),
      ...(query
        ? {
            OR: [
              {
                number: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                product: {
                  code: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                product: {
                  name: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),

      ...(productId
        ? {
            productId,
          }
        : {}),
    };

    const allWorkOrders = await prisma.workOrder.findMany({
      where,
      orderBy: {
        createdAt: "desc",
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
                      select: { departmentId: true },
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
            workOrderItem: {
              select: {
                id: true,
                parentItemId: true,
              },
            },
          },
          orderBy: { executionOrder: "asc" },
        },
        items: {
          select: {
            id: true,
            parentItemId: true,
          },
        },
      },
    });

    const scopedWorkOrders =
      auth.user.role === "ADMIN"
        ? allWorkOrders
        : allWorkOrders.map((workOrder) => {
            const scopedOperations = workOrder.operations.filter(
              (execution) =>
                execution.machine?.departmentId === auth.user.department?.id ||
                (!execution.machine &&
                  execution.operation.machines.some(
                  (assignment) =>
                    assignment.machine.departmentId === auth.user.department?.id,
                  )),
            );
            return {
              ...workOrder,
              operations: scopedOperations,
              items: workOrder.items.filter((item) =>
                scopedOperations.some(
                  (operation) => operation.workOrderItemId === item.id,
                ),
              ),
            };
          }).filter((workOrder) => workOrder.operations.length > 0);

    const filteredWorkOrders = scopedWorkOrders.filter(
      (workOrder) => {
        if (!status || status === "ALL") {
          return true;
        }

        const total = workOrder.operations.length;

        const completed = workOrder.operations.filter(
          (operation) =>
            operation.status === "COMPLETED",
        ).length;

        const calculatedStatus =
          total > 0 && completed === total
            ? "COMPLETED"
            : workOrder.operations.some(
                  (operation) =>
                    operation.status === "RUNNING" ||
                    operation.status === "COMPLETED",
                )
              ? "IN_PROGRESS"
              : "PLANNED";

        return calculatedStatus === status;
      },
    );

    const total = filteredWorkOrders.length;

    const totalPages =
      total > 0 ? Math.ceil(total / limit) : 1;

    const currentPage = Math.min(page, totalPages);

    const startIndex =
      (currentPage - 1) * limit;

    const paginatedWorkOrders =
      filteredWorkOrders.slice(
        startIndex,
        startIndex + limit,
      );

    return NextResponse.json({
      data: paginatedWorkOrders,
      total,
      page: currentPage,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Greška pri učitavanju radnih naloga",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authorizeApi(true);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();

    const productId = body.productId;
    const quantity = Number(body.quantity);

    if (!productId) {
      return NextResponse.json(
        {
          error: "productId je obavezan",
        },
        {
          status: 400,
        },
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          error: "quantity mora biti pozitivan ceo broj",
        },
        {
          status: 400,
        },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "Proizvod nije pronađen",
        },
        {
          status: 404,
        },
      );
    }

    const routing = await prisma.routing.findUnique({
  where: {
    productId_revision: {
      productId,
      revision: product.revision,
    },
  },
  include: {
    operations: {
      include: {
        machines: true,
      },
      orderBy: {
        sequence: "asc",
      },
    },
  },
});

    if (!routing) {
      return NextResponse.json(
        {
          error:
            "Za izabrani proizvod ne postoji routing za trenutnu reviziju",
        },
        {
          status: 400,
        },
      );
    }

    if (routing.operations.length === 0) {
      return NextResponse.json(
        {
          error:
            "Routing za izabrani proizvod nema nijednu operaciju",
        },
        {
          status: 400,
        },
      );
    }

    const bom = await buildBom(productId);

    const year = new Date().getFullYear();

    const lastWorkOrder = await prisma.workOrder.findFirst({
      where: {
        number: {
          startsWith: `WO-${year}-`,
        },
      },
      orderBy: {
        number: "desc",
      },
    });

    let nextNumber = 1;

    if (lastWorkOrder) {
      const lastNumber = Number(
        lastWorkOrder.number.split("-")[2],
      );

      if (Number.isInteger(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const number = `WO-${year}-${String(nextNumber).padStart(4, "0")}`;

    const workOrder = await prisma.$transaction(async (tx) => {
      const createdWorkOrder = await tx.workOrder.create({
        data: {
          number,
          productId,
          quantity,
          status: "PLANNED",
        },
      });

      async function createWorkOrderItem(
        itemProductId: string,
        itemQuantity: number,
        parentItemId: string | null,
        operations: {
  id: string;
  sequence: number;
  machines: {
    machineId: string;
  }[];
}[],
        children: BomNode[],
      ): Promise<
{
  workOrderItemId: string;
  operation: {
    id: string;
    machines: { machineId: string }[];
  };
}[]
      > {
const workOrderItem = await tx.workOrderItem.create({
  data: {
    workOrderId: createdWorkOrder.id,
            productId: itemProductId,
            parentItemId,
            quantity: itemQuantity,
          },
        });
        const childExecutions: {
          workOrderItemId: string;
          operation: {
            id: string;
            machines: { machineId: string }[];
          };
        }[] = [];

        for (const child of children) {
          const childRouting =
  await tx.routing.findUnique({
    where: {
      productId_revision: {
        productId: child.child.id,
        revision: child.child.revision,
      },
    },
    include: {
      operations: {
        include: {
          machines: true,
        },
        orderBy: {
          sequence: "asc",
        },
      },
    },
  });

          childExecutions.push(...await createWorkOrderItem(
            child.child.id,
            itemQuantity * child.quantity,
            workOrderItem.id,
            childRouting?.operations ?? [],
            child.children,
          ));
        }

        return [
          ...childExecutions,
          ...operations.map((operation) => ({
            workOrderItemId: workOrderItem.id,
            operation,
          })),
        ];
      }

      const orderedExecutions = await createWorkOrderItem(
        product.id,
        quantity,
        null,
        routing.operations,
        bom,
      );

      await tx.operationExecution.createMany({
        data: orderedExecutions.map(
          ({ workOrderItemId, operation }, index) => {
            return {
              workOrderId: createdWorkOrder.id,
              workOrderItemId,
              operationId: operation.id,
              executionOrder: index,
              machineId: operation.machines[0]?.machineId ?? null,
              status: "WAITING",
            };
          },
        ),
      });

      return tx.workOrder.findUnique({
        where: {
          id: createdWorkOrder.id,
        },
        include: {
          product: true,
          items: {
            include: {
              product: true,
              parentItem: true,
              childItems: true,
              operations: {
                include: {
                  operation: true,
                  machine: true,
                },
                orderBy: { executionOrder: "asc" },
              },
            },
          },
          operations: {
            include: {
              operation: true,
              machine: true,
            },
            orderBy: { executionOrder: "asc" },
          },
        },
      });
    });

    return NextResponse.json(workOrder, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri kreiranju radnog naloga",
      },
      {
        status: 500,
      },
    );
  }
}
