import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const machines = await prisma.machine.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(machines);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Greška pri učitavanju mašina",
      },
      {
        status: 500,
      },
    );
  }
}