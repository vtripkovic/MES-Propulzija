import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: true,
        operations: {
          include: {
            operation: true,
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

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Greška pri učitavanju radnih naloga",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
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

      await tx.operationExecution.createMany({
        data: routing.operations.map((operation, index) => ({
          workOrderId: createdWorkOrder.id,
          operationId: operation.id,
          status: index === 0 ? "READY" : "WAITING",
        })),
      });

      return tx.workOrder.findUnique({
        where: {
          id: createdWorkOrder.id,
        },
        include: {
          product: true,
          operations: {
            include: {
              operation: true,
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