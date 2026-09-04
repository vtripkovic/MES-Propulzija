import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        code: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        revision: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Greška pri učitavanju proizvoda",
      },
      {
        status: 500,
      },
    );
  }
}
