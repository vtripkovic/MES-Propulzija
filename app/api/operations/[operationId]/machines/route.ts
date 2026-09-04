import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    operationId: string;
  }>;
};

/* -------------------------------------------------------------------------- */
/* GET - Dodeljene mašine                                                     */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { operationId } = await context.params;

    const operation = await prisma.operation.findUnique({
      where: {
        id: operationId,
      },
    });

    if (!operation) {
      return NextResponse.json(
        {
          error: "Operacija nije pronađena",
        },
        {
          status: 404,
        },
      );
    }

    const operationMachines =
      await prisma.operationMachine.findMany({
        where: {
          operationId,
        },
        include: {
          machine: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          machine: {
            name: "asc",
          },
        },
      });

    const machines = operationMachines.map(
      (operationMachine) =>
        operationMachine.machine,
    );

    return NextResponse.json(machines);
  } catch (error) {
    console.error(
      "OPERATION MACHINES GET ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri učitavanju mašina",
      },
      {
        status: 500,
      },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST - Dodeli mašinu operaciji                                             */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { operationId } = await context.params;

    const body = await request.json();

    const machineId =
      typeof body.machineId === "string"
        ? body.machineId.trim()
        : "";

    if (!machineId) {
      return NextResponse.json(
        {
          error: "machineId je obavezan",
        },
        {
          status: 400,
        },
      );
    }

    const operation =
      await prisma.operation.findUnique({
        where: {
          id: operationId,
        },
      });

    if (!operation) {
      return NextResponse.json(
        {
          error: "Operacija nije pronađena",
        },
        {
          status: 404,
        },
      );
    }

    const machine =
      await prisma.machine.findUnique({
        where: {
          id: machineId,
        },
        include: {
          department: true,
        },
      });

    if (!machine) {
      return NextResponse.json(
        {
          error: "Mašina nije pronađena",
        },
        {
          status: 404,
        },
      );
    }

    const existing =
      await prisma.operationMachine.findUnique({
        where: {
          operationId_machineId: {
            operationId,
            machineId,
          },
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Mašina je već dodeljena ovoj operaciji",
        },
        {
          status: 409,
        },
      );
    }

    const operationMachine =
      await prisma.operationMachine.create({
        data: {
          operationId,
          machineId,
        },
        include: {
          machine: {
            include: {
              department: true,
            },
          },
        },
      });

    return NextResponse.json(
      operationMachine,
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "OPERATION MACHINES POST ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri dodeljivanju mašine",
      },
      {
        status: 500,
      },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE - Ukloni mašinu sa operacije                                        */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const { operationId } = await context.params;

    const body = await request.json();

    const machineId =
      typeof body.machineId === "string"
        ? body.machineId.trim()
        : "";

    if (!machineId) {
      return NextResponse.json(
        {
          error: "machineId je obavezan",
        },
        {
          status: 400,
        },
      );
    }

    const operationMachine =
      await prisma.operationMachine.findUnique({
        where: {
          operationId_machineId: {
            operationId,
            machineId,
          },
        },
      });

    if (!operationMachine) {
      return NextResponse.json(
        {
          error:
            "Mašina nije dodeljena ovoj operaciji",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.operationMachine.delete({
      where: {
        operationId_machineId: {
          operationId,
          machineId,
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "OPERATION MACHINES DELETE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri uklanjanju mašine",
      },
      {
        status: 500,
      },
    );
  }
}