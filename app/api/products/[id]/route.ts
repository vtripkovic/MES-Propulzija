import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "ID proizvoda je obavezan",
        },
        {
          status: 400,
        },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        workOrders: {
          select: {
            number: true,
          },
        },
        routings: {
          include: {
            operations: {
              select: {
                id: true,
              },
            },
          },
        },
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

    /*
     * Proizvod koji već ima radne naloge
     * ne dozvoljavamo da se obriše.
     */
    if (product.workOrders.length > 0) {
      return NextResponse.json(
        {
          error:
            "Proizvod nije moguće obrisati jer postoje radni nalozi za ovaj proizvod.",
          workOrders: product.workOrders.map(
            (workOrder) => workOrder.number,
          ),
        },
        {
          status: 409,
        },
      );
    }

    await prisma.$transaction(async (tx) => {
      /*
       * 1. Brišemo BOM veze gde je proizvod
       *    roditelj ili dete.
       */
      await tx.bOMItem.deleteMany({
        where: {
          OR: [
            {
              parentId: id,
            },
            {
              childId: id,
            },
          ],
        },
      });

      /*
       * 2. Brišemo routinge i njihove operacije.
       */
      for (const routing of product.routings) {
        for (const operation of routing.operations) {
          /*
           * Operacija može imati dodeljene mašine.
           */
          await tx.operationMachine.deleteMany({
            where: {
              operationId: operation.id,
            },
          });

          /*
           * Operacija može imati izvršenja.
           */
          await tx.operationExecution.deleteMany({
            where: {
              operationId: operation.id,
            },
          });

          await tx.operation.delete({
            where: {
              id: operation.id,
            },
          });
        }

        await tx.routing.delete({
          where: {
            id: routing.id,
          },
        });
      }

      /*
       * 3. Na kraju brišemo sam proizvod.
       */
      await tx.product.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Proizvod "${product.code}" je uspešno obrisan.`,
    });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri brisanju proizvoda",
      },
      {
        status: 500,
      },
    );
  }
}