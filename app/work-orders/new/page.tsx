"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  code: string;
  name: string;
  revision: string;
};

type Operation = {
  id: string;
  sequence: number;
  name: string;
  type: string;
  setupTime: number | null;
  cycleTime: number | null;
};

type RoutingResponse = {
  id: string;
  revision: string;
  operations: Operation[];
};

export default function NewWorkOrderPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [routing, setRouting] =
    useState<RoutingResponse | null>(null);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [loadingRouting, setLoadingRouting] =
    useState(false);

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch(
          "/api/products",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Greška pri učitavanju proizvoda",
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setProducts(data.value ?? data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Greška pri učitavanju proizvoda",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProductId) {
      return;
    }

    let cancelled = false;

    async function loadRouting() {
      setLoadingRouting(true);
      setError("");

      try {
        const response = await fetch(
          `/api/products/${selectedProductId}/routing`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const data = await response.json();

          throw new Error(
            data.error ??
              "Za ovaj proizvod nije pronađen routing",
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setRouting(data);
        }
      } catch (err) {
        if (!cancelled) {
          setRouting(null);

          setError(
            err instanceof Error
              ? err.message
              : "Greška pri učitavanju routing-a",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRouting(false);
        }
      }
    }

    void loadRouting();

    return () => {
      cancelled = true;
    };
  }, [selectedProductId]);

  const selectedProduct = products.find(
    (product) =>
      product.id === selectedProductId,
  );

  async function createWorkOrder() {
    setError("");

    const parsedQuantity = Number(quantity);

    if (!selectedProductId) {
      setError("Izaberi proizvod");
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        "Količina mora biti pozitivan ceo broj",
      );
      return;
    }

    if (
      !routing ||
      routing.operations.length === 0
    ) {
      setError(
        "Izabrani proizvod nema definisan routing",
      );
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(
        "/api/work-orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: selectedProductId,
            quantity: parsedQuantity,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Greška pri kreiranju radnog naloga",
        );
      }

      router.push(
        `/work-orders/${data.id}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri kreiranju radnog naloga",
      );
    } finally {
      setCreating(false);
    }
  }

  if (loadingProducts) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        Učitavanje proizvoda...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 text-sm text-gray-600 hover:text-black"
          >
            ← Nazad
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Novi radni nalog
          </h1>

          <p className="mt-1 text-gray-600">
            Kreiranje radnog naloga na osnovu
            proizvodnog procesa
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Proizvod
            </label>

            <select
              value={selectedProductId}
              onChange={(event) =>
                setSelectedProductId(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white p-4 text-lg"
            >
              <option value="">
                Izaberi proizvod
              </option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.code} — {product.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-sm text-gray-500">
                  Šifra proizvoda
                </div>

                <div className="mt-1 font-semibold">
                  {selectedProduct.code}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-sm text-gray-500">
                  Revizija
                </div>

                <div className="mt-1 font-semibold">
                  {selectedProduct.revision}
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Količina
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 p-4 text-lg"
            />
          </div>

          <div className="mb-8">
            <div className="mb-3">
              <h2 className="text-xl font-semibold">
                Proizvodni proces
              </h2>

              <p className="text-sm text-gray-500">
                Operacije koje će biti kreirane
                za ovaj radni nalog
              </p>
            </div>

            {loadingRouting && (
              <div className="rounded-lg bg-gray-50 p-5 text-gray-600">
                Učitavanje procesa...
              </div>
            )}

            {!selectedProductId &&
              !loadingRouting && (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                  Izaberi proizvod da bi se
                  prikazao proizvodni proces.
                </div>
              )}

            {!loadingRouting &&
              selectedProductId &&
              routing &&
              routing.operations.length > 0 && (
                <div className="space-y-3">
                  {routing.operations.map(
                    (operation, index) => (
                      <div
                        key={operation.id}
                        className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">
                            {operation.name}
                          </div>

                          <div className="mt-1 text-sm text-gray-500">
                            {operation.type}
                          </div>
                        </div>

                        <div className="text-right text-sm text-gray-500">
                          {operation.cycleTime !==
                            null && (
                            <div>
                              Ciklus:{" "}
                              {
                                operation.cycleTime
                              } min
                            </div>
                          )}

                          {operation.setupTime !==
                            null && (
                            <div>
                              Setup:{" "}
                              {
                                operation.setupTime
                              } min
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

            {!loadingRouting &&
              selectedProductId &&
              !routing && (
                <div className="rounded-lg bg-yellow-50 p-5 text-yellow-800">
                  Za ovaj proizvod nije pronađen
                  proizvodni proces.
                </div>
              )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={creating}
              className="flex-1 rounded-xl border border-gray-300 px-6 py-4 text-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              OTKAŽI
            </button>

            <button
              type="button"
              onClick={createWorkOrder}
              disabled={
                creating ||
                loadingRouting ||
                !selectedProductId ||
                !routing
              }
              className="flex-1 rounded-xl bg-black px-6 py-4 text-lg font-bold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {creating
                ? "Kreiranje..."
                : "KREIRAJ NALOG"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}