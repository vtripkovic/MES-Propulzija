"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

type Product = {
  id: string;
  code: string;
  name: string;
  revision: string;
};

type BomResponse = {
  product: Product;
  items: BomNode[];
};

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<BomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        const response = await fetch(
          `/api/products/${id}/bom`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Greška pri učitavanju proizvoda",
          );
        }

        const result: BomResponse =
          await response.json();

        if (!cancelled) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Nepoznata greška",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600">
          Učitavanje...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
        <div className="rounded-xl bg-red-100 p-6 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Nazad na proizvodnju
          </Link>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Proizvod
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                {data.product.name}
              </h1>

              <p className="mt-2 text-gray-600">
                Šifra: {data.product.code}
              </p>
            </div>

            <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium">
              Revizija {data.product.revision}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              BOM struktura
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Struktura sklopa i komponenti proizvoda
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5">
            {data.items.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                Proizvod nema definisanu BOM strukturu.
              </div>
            ) : (
              <div className="space-y-1">
                {data.items.map((item) => (
                  <BomTree
                    key={item.id}
                    node={item}
                    level={0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function BomTree({
  node,
  level,
}: {
  node: BomNode;
  level: number;
}) {
  const [expanded, setExpanded] = useState(true);

  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center rounded-lg px-3 py-3 hover:bg-gray-50"
        style={{
          paddingLeft: `${level * 32 + 12}px`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (hasChildren) {
              setExpanded((value) => !value);
            }
          }}
          className={`mr-2 flex h-7 w-7 items-center justify-center rounded-md text-sm ${
            hasChildren
              ? "cursor-pointer bg-gray-100 hover:bg-gray-200"
              : "cursor-default text-gray-300"
          }`}
        >
          {hasChildren
            ? expanded
              ? "▼"
              : "▶"
            : "•"}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-gray-900">
              {node.child.code}
            </span>

            <span className="text-gray-700">
              {node.child.name}
            </span>

            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
              Rev. {node.child.revision}
            </span>
          </div>
        </div>

        <div className="ml-4 whitespace-nowrap text-sm font-medium text-gray-600">
          × {node.quantity}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <BomTree
              key={child.id}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}