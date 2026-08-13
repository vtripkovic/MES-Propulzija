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

async function buildBom(productId: string): Promise<BomNode[]> {
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
    const children = await buildBom(item.childId);

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
  context: { params: Promise<{ id: string }> },
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

    return NextResponse.json({
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
        revision: product.revision,
      },
      items,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Greška pri učitavanju BOM strukture",
      },
      {
        status: 500,
      },
    );
  }
}