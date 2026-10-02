import { NextResponse } from "next/server";
import { authorizeApi } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const auth = await authorizeApi();
  if (auth.response) return auth.response;
  try {
    const machines = await prisma.machine.findMany({
      where:
        auth.user.role === "ADMIN"
          ? undefined
          : { departmentId: auth.user.department?.id ?? "__no_department__" },
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
