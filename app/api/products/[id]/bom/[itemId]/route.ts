import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id: parentId, itemId } =
      await context.params;

    const body = await request.json();

    const quantity = Number(body.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          error: "Količina mora biti veća od nule",
        },
        {
          status: 400,
        },
      );
    }

    const item = await prisma.bOMItem.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          error: "BOM stavka nije pronađena",
        },
        {
          status: 404,
        },
      );
    }

    if (item.parentId !== parentId) {
      return NextResponse.json(
        {
          error:
            "BOM stavka ne pripada ovom proizvodu",
        },
        {
          status: 400,
        },
      );
    }

    const updatedItem =
      await prisma.bOMItem.update({
        where: {
          id: itemId,
        },
        data: {
          quantity,
        },
        include: {
          child: {
            select: {
              id: true,
              code: true,
              name: true,
              revision: true,
            },
          },
        },
      });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri izmeni BOM stavke",
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
    const { id: parentId, itemId } =
      await context.params;

    const item = await prisma.bOMItem.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          error: "BOM stavka nije pronađena",
        },
        {
          status: 404,
        },
      );
    }

    if (item.parentId !== parentId) {
      return NextResponse.json(
        {
          error:
            "BOM stavka ne pripada ovom proizvodu",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.bOMItem.delete({
      where: {
        id: itemId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri brisanju BOM stavke",
      },
      {
        status: 500,
      },
    );
  }
}