"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { LoadingSkeleton } from "@/app/components/loading";
import { ErrorAlert } from "@/app/components/alerts";

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Proizvodi
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              Upravljanje proizvodima, sklopovima i komponentama
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorAlert
                message={error}
                onDismiss={() => setError("")}
              />
            </div>
          )}

          {loading ? (
            <LoadingSkeleton count={6} />
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-lg text-gray-700 font-medium">
                Nema registrovanih proizvoda
              </p>
              <p className="mt-1 text-gray-500">
                Počnite sa dodavanjem prvog proizvoda
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">
            📦
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Rev. {product.revision}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 truncate">
          {product.code}
        </h3>
        <p className="mt-1 text-lg font-bold text-gray-800 line-clamp-2">
          {product.name}
        </p>

        {product.description && (
          <p className="mt-2 text-sm text-gray-700 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:text-blue-700">
          Detaljno
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}
