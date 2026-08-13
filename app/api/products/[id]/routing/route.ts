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

    return NextResponse.json(routing);
  } catch (error) {
    console.error(error);

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