"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  revision: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            "Greška pri učitavanju proizvoda",
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setProducts(data.value ?? data);
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

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600">
          Učitavanje proizvoda...
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

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Nazad na početnu
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Proizvodi
            </h1>

            <p className="mt-1 text-gray-600">
              Pregled proizvoda, sklopova i komponenti
            </p>
          </div>

          <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm">
            Ukupno: {products.length}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Nema registrovanih proizvoda.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="divide-y divide-gray-200">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ProductRow({
  product,
}: {
  product: Product;
}) {
  return (
    <div className="flex items-center gap-6 p-5 hover:bg-gray-50">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
        📦
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-gray-900">
            {product.code}
          </span>

          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
            Rev. {product.revision}
          </span>
        </div>

        <div className="mt-1 text-lg text-gray-800">
          {product.name}
        </div>

        {product.description && (
          <div className="mt-1 text-sm text-gray-500">
            {product.description}
          </div>
        )}
      </div>

      <Link
        href={`/products/${product.id}`}
        className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Otvori
      </Link>
    </div>
  );
}