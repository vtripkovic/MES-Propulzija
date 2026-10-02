import { NextResponse } from "next/server";
import { authorizeApi } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    operationId: string;
  }>;
};

function parseOperationBody(body: Record<string, unknown>) {
  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const type =
    typeof body.type === "string" ? body.type.trim() : "";
  const sequence = Number(body.sequence);
  const setupTime =
    body.setupTime === null || body.setupTime === undefined || body.setupTime === ""
      ? null
      : Number(body.setupTime);
  const cycleTime =
    body.cycleTime === null || body.cycleTime === undefined || body.cycleTime === ""
      ? null
      : Number(body.cycleTime);

  if (!name || !type) {
    return {
      error: !name
        ? "Naziv operacije je obavezan"
        : "Tip operacije je obavezan",
    };
  }

  if (!Number.isInteger(sequence) || sequence <= 0) {
    return { error: "Redosled operacije mora biti pozitivan ceo broj" };
  }

  if (
    (setupTime !== null &&
      (!Number.isInteger(setupTime) || setupTime < 0)) ||
    (cycleTime !== null &&
      (!Number.isInteger(cycleTime) || cycleTime < 0))
  ) {
    return {
      error: "Vremena moraju biti celi brojevi veći ili jednaki nuli",
    };
  }

  return {
    value: { name, type, sequence, setupTime, cycleTime },
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authorizeApi(true);
  if (auth.response) return auth.response;
  try {
    const { id: productId, operationId } = await context.params;
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Podaci operacije nisu ispravni" },
        { status: 400 },
      );
    }

    const parsed = parseOperationBody(body as Record<string, unknown>);

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: { revision: true },
    });

    const routing = product
      ? await prisma.routing.findUnique({
          where: {
            productId_revision: {
              productId,
              revision: product.revision,
            },
          },
          select: { id: true },
        })
      : null;

    const operation = routing
      ? await prisma.operation.findFirst({
          where: {
            id: operationId,
            routingId: routing.id,
          },
          select: { id: true, routingId: true },
        })
      : null;

    if (!operation) {
      return NextResponse.json(
        { error: "Operacija nije pronađena" },
        { status: 404 },
      );
    }

    const duplicateSequence = await prisma.operation.findFirst({
      where: {
        routingId: operation.routingId,
        sequence: parsed.value.sequence,
        id: { not: operationId },
      },
      select: { id: true },
    });

    if (duplicateSequence) {
      return NextResponse.json(
        { error: `Operacija sa rednim brojem ${parsed.value.sequence} već postoji` },
        { status: 409 },
      );
    }

    const updatedOperation = await prisma.operation.update({
      where: { id: operationId },
      data: parsed.value,
      include: {
        machines: {
          include: {
            machine: {
              include: { department: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedOperation);
  } catch (error) {
    console.error("OPERATIONS PATCH ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri izmeni operacije",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await authorizeApi(true);
  if (auth.response) return auth.response;
  try {
    const { id: productId, operationId } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { revision: true },
    });

    const routing = product
      ? await prisma.routing.findUnique({
          where: {
            productId_revision: {
              productId,
              revision: product.revision,
            },
          },
          select: { id: true },
        })
      : null;

    const operation = routing
      ? await prisma.operation.findFirst({
          where: {
            id: operationId,
            routingId: routing.id,
          },
          select: { id: true, name: true },
        })
      : null;

    if (!operation) {
      return NextResponse.json(
        { error: "Operacija nije pronađena" },
        { status: 404 },
      );
    }

    const executionCount = await prisma.operationExecution.count({
      where: { operationId },
    });

    if (executionCount > 0) {
      return NextResponse.json(
        {
          error:
            "Operacija se koristi u radnim nalozima i ne može biti obrisana.",
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.operationMachine.deleteMany({
        where: { operationId },
      });

      await tx.operation.delete({
        where: { id: operationId },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Operacija "${operation.name}" je obrisana.`,
    });
  } catch (error) {
    console.error("OPERATIONS DELETE ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri brisanju operacije",
      },
      { status: 500 },
    );
  }
}
