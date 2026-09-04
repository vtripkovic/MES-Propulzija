import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type BomNode = {
  id: string;
  quantity: number;
  child: {
    id: string;
    code: string;
    name: string;
    revision: string;
  };
  children: BomNode[];
};

type AvailableProduct = {
  id: string;
  code: string;
  name: string;
  revision: string;
  allowed: boolean;
  reason:
    | "self"
    | "already-exists"
    | "cycle"
    | null;
};

async function buildBom(
  productId: string,
  visited = new Set<string>(),
): Promise<BomNode[]> {
  if (visited.has(productId)) {
    throw new Error("Cyclic BOM structure detected");
  }

  const nextVisited = new Set(visited);
  nextVisited.add(productId);

  const items = await prisma.bOMItem.findMany({
    where: {
      parentId: productId,
    },
    include: {
      child: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const result: BomNode[] = [];

  for (const item of items) {
    const children = await buildBom(
      item.childId,
      nextVisited,
    );

    result.push({
      id: item.id,
      quantity: item.quantity,
      child: {
        id: item.child.id,
        code: item.child.code,
        name: item.child.name,
        revision: item.child.revision,
      },
      children,
    });
  }

  return result;
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
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

    const items = await buildBom(product.id);

    /*
     * PRE-CHECK ZA DODAVANJE KOMPONENTI
     *
     * Za svaki proizvod određujemo:
     * - allowed: može li da se doda
     * - reason: zašto ne može
     */

    const allProducts =
      await prisma.product.findMany({
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

    const existingItems =
      await prisma.bOMItem.findMany({
        where: {
          parentId: product.id,
        },
        select: {
          childId: true,
        },
      });

    const existingChildIds = new Set(
      existingItems.map(
        (item) => item.childId,
      ),
    );

    const availableProducts: AvailableProduct[] =
      [];

    for (const candidate of allProducts) {
      /*
       * Sam proizvod ne može biti
       * komponenta samom sebi.
       */
      if (candidate.id === product.id) {
        availableProducts.push({
          ...candidate,
          allowed: false,
          reason: "self",
        });

        continue;
      }

      /*
       * Komponenta koja već postoji direktno
       * u BOM-u ne može ponovo da se doda.
       */
      if (existingChildIds.has(candidate.id)) {
        availableProducts.push({
          ...candidate,
          allowed: false,
          reason: "already-exists",
        });

        continue;
      }

      /*
       * Provera da li bi dodavanje kandidata
       * napravilo ciklus.
       */
      const createsCycle =
        await wouldCreateCycle(
          product.id,
          candidate.id,
        );

      if (createsCycle) {
        availableProducts.push({
          ...candidate,
          allowed: false,
          reason: "cycle",
        });

        continue;
      }

      /*
       * Kandidat je dozvoljen.
       */
      availableProducts.push({
        ...candidate,
        allowed: true,
        reason: null,
      });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
        revision: product.revision,
      },
      items,
      availableProducts,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri učitavanju BOM strukture",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id: parentId } =
      await context.params;

    const body = await request.json();

    const childId =
      typeof body.childId === "string"
        ? body.childId
        : "";

    const quantity = Number(
      body.quantity,
    );

    console.log("BOM POST START", {
      parentId,
      childId,
      quantity,
    });

    if (!childId) {
      console.log(
        "400: childId missing",
      );

      return NextResponse.json(
        {
          error:
            "childId je obavezan",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      console.log(
        "400: invalid quantity",
        quantity,
      );

      return NextResponse.json(
        {
          error:
            "Količina mora biti veća od nule",
        },
        {
          status: 400,
        },
      );
    }

    if (parentId === childId) {
      console.log(
        "400: parent === child",
      );

      return NextResponse.json(
        {
          error:
            "Proizvod ne može biti sam sebi komponenta",
        },
        {
          status: 400,
        },
      );
    }

    const parent =
      await prisma.product.findUnique({
        where: {
          id: parentId,
        },
      });

    console.log("PARENT:", parent);

    if (!parent) {
      console.log(
        "404: parent missing",
      );

      return NextResponse.json(
        {
          error:
            "Nadređeni proizvod nije pronađen",
        },
        {
          status: 404,
        },
      );
    }

    const child =
      await prisma.product.findUnique({
        where: {
          id: childId,
        },
      });

    console.log("CHILD:", child);

    if (!child) {
      console.log(
        "404: child missing",
      );

      return NextResponse.json(
        {
          error:
            "Komponenta nije pronađena",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Provera da komponenta već ne postoji
     * direktno u BOM-u.
     */
    const existingItem =
      await prisma.bOMItem.findUnique({
        where: {
          parentId_childId: {
            parentId,
            childId,
          },
        },
      });

    console.log(
      "EXISTING ITEM:",
      existingItem,
    );

    if (existingItem) {
      console.log(
        "409: item already exists",
      );

      return NextResponse.json(
        {
          error:
            "Ova komponenta već postoji u BOM-u",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * ZAVRŠNA PROVERA CIKLUSA
     *
     * Ovo ostaje čak i kada UI već
     * unapred proverava komponente.
     */
    const createsCycle =
      await wouldCreateCycle(
        parentId,
        childId,
      );

    console.log(
      "CREATES CYCLE RESULT:",
      createsCycle,
    );

    if (createsCycle === true) {
      console.log(
        "400: cycle detected",
        {
          createsCycle,
          type: typeof createsCycle,
        },
      );

      return NextResponse.json(
        {
          error:
            "Dodavanje komponente bi napravilo cikličnu BOM strukturu",
        },
        {
          status: 400,
        },
      );
    }

    console.log(
      "ABOUT TO CREATE BOM ITEM",
    );

    const item =
      await prisma.bOMItem.create({
        data: {
          parentId,
          childId,
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

    console.log(
      "BOM ITEM CREATED:",
      item,
    );

    return NextResponse.json(
      item,
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "BOM POST ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri dodavanju BOM stavke",
      },
      {
        status: 500,
      },
    );
  }
}

async function wouldCreateCycle(
  parentId: string,
  childId: string,
): Promise<boolean> {
  console.log("=== NEW CYCLE CHECK v2 ===", {
    parentId,
    childId,
  });

  const visited = new Set<string>();

  async function isDescendant(
    currentId: string,
  ): Promise<boolean> {
    console.log("=== NEW CYCLE WALK v2 ===", {
      currentId,
      parentId,
      childId,
    });

    if (currentId === parentId) {
      console.log(
        "=== NEW CYCLE FOUND v2 ===",
      );

      return true;
    }

    if (visited.has(currentId)) {
      return false;
    }

    visited.add(currentId);

    const children =
      await prisma.bOMItem.findMany({
        where: {
          parentId: currentId,
        },
        select: {
          childId: true,
        },
      });

    console.log(
      "=== NEW CYCLE CHILDREN v2 ===",
      {
        currentId,
        children,
      },
    );

    for (const child of children) {
      if (
        await isDescendant(child.childId)
      ) {
        return true;
      }
    }

    return false;
  }

  const result =
    await isDescendant(childId);

  console.log(
    "=== NEW CYCLE RESULT v2 ===",
    {
      parentId,
      childId,
      result,
    },
  );

  return result;
}