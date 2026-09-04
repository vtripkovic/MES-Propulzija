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
    const { id: productId } = await context.params;

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
          productId: product.id,
          revision: product.revision,
        },
      },
    });

    if (!routing) {
      return NextResponse.json(
        {
          error: "Za ovaj proizvod ne postoji routing",
        },
        {
          status: 404,
        },
      );
    }

    const operations = await prisma.operation.findMany({
      where: {
        routingId: routing.id,
      },
      orderBy: {
        sequence: "asc",
      },
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
    });

    return NextResponse.json(operations);
  } catch (error) {
    console.error("OPERATIONS GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri učitavanju operacija",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id: productId } = await context.params;

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const type =
      typeof body.type === "string"
        ? body.type.trim()
        : "";

    const sequence = Number(body.sequence);

    const setupTime =
      body.setupTime === null ||
      body.setupTime === undefined ||
      body.setupTime === ""
        ? null
        : Number(body.setupTime);

    const cycleTime =
      body.cycleTime === null ||
      body.cycleTime === undefined ||
      body.cycleTime === ""
        ? null
        : Number(body.cycleTime);

    if (!name) {
      return NextResponse.json(
        {
          error: "Naziv operacije je obavezan",
        },
        {
          status: 400,
        },
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          error: "Tip operacije je obavezan",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(sequence) ||
      sequence <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Redosled operacije mora biti pozitivan ceo broj",
        },
        {
          status: 400,
        },
      );
    }

    if (
      setupTime !== null &&
      (!Number.isInteger(setupTime) ||
        setupTime < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Setup vreme mora biti ceo broj veći ili jednak nuli",
        },
        {
          status: 400,
        },
      );
    }

    if (
      cycleTime !== null &&
      (!Number.isInteger(cycleTime) ||
        cycleTime < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Cycle vreme mora biti ceo broj veći ili jednak nuli",
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
          productId: product.id,
          revision: product.revision,
        },
      },
    });

    if (!routing) {
      return NextResponse.json(
        {
          error:
            "Za ovaj proizvod ne postoji routing",
        },
        {
          status: 404,
        },
      );
    }

    const existingOperation =
      await prisma.operation.findUnique({
        where: {
          routingId_sequence: {
            routingId: routing.id,
            sequence,
          },
        },
      });

    if (existingOperation) {
      return NextResponse.json(
        {
          error:
            `Operacija sa rednim brojem ${sequence} već postoji`,
        },
        {
          status: 409,
        },
      );
    }

    const operation =
      await prisma.operation.create({
        data: {
          routingId: routing.id,
          sequence,
          name,
          type,
          setupTime,
          cycleTime,
        },
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
      });

    return NextResponse.json(
      operation,
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("OPERATIONS POST ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri kreiranju operacije",
      },
      {
        status: 500,
      },
    );
  }
}