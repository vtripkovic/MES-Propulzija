import { NextResponse } from "next/server";
import { authorizeApi } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const auth = await authorizeApi();
  if (auth.response) return auth.response;
  try {
    const products = await prisma.product.findMany({
      where:
        auth.user.role === "ADMIN"
          ? undefined
          : {
              routings: {
                some: {
                  operations: {
                    some: {
                      machines: {
                        some: {
                          machine: {
                            departmentId: auth.user.department?.id ?? "__no_department__",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
      orderBy: {
        code: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
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

export async function POST(request: Request) {
  const auth = await authorizeApi(true);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();

    const code =
      typeof body.code === "string"
        ? body.code.trim()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const revision =
      typeof body.revision === "string"
        ? body.revision.trim()
        : "A";

    if (!code) {
      return NextResponse.json(
        {
          error: "Šifra proizvoda je obavezna",
        },
        {
          status: 400,
        },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "Naziv proizvoda je obavezan",
        },
        {
          status: 400,
        },
      );
    }

    if (!revision) {
      return NextResponse.json(
        {
          error: "Revizija je obavezna",
        },
        {
          status: 400,
        },
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        code,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          error: `Proizvod sa šifrom "${code}" već postoji`,
        },
        {
          status: 409,
        },
      );
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          code,
          name,
          description: description || null,
          revision,
        },
      });

      await tx.routing.create({
        data: {
          productId: newProduct.id,
          revision: newProduct.revision,
        },
      });

      return newProduct;
    });

    return NextResponse.json(
      {
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        revision: product.revision,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("PRODUCT POST ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri kreiranju proizvoda",
      },
      {
        status: 500,
      },
    );
  }
}