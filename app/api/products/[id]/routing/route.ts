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

    const product = await prisma.product.findUnique({
      where: {
        id,
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
          productId: id,
          revision: product.revision,
        },
      },
      include: {
        operations: {
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
        },
      },
    });

    if (!routing) {
      return NextResponse.json(
        {
          routing: null,
          product: {
            id: product.id,
            code: product.code,
            name: product.name,
            revision: product.revision,
          },
          message: "Za ovaj proizvod ne postoji routing",
        },
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(routing);
  } catch (error) {
    console.error("ROUTING GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri učitavanju routing-a",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: {
        id,
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

    const existingRouting =
      await prisma.routing.findUnique({
        where: {
          productId_revision: {
            productId: product.id,
            revision: product.revision,
          },
        },
      });

    if (existingRouting) {
      return NextResponse.json(existingRouting, {
        status: 200,
      });
    }

    const routing = await prisma.routing.create({
      data: {
        productId: product.id,
        revision: product.revision,
      },
    });

    return NextResponse.json(routing, {
      status: 201,
    });
  } catch (error) {
    console.error("ROUTING POST ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri kreiranju routing-a",
      },
      {
        status: 500,
      },
    );
  }
}