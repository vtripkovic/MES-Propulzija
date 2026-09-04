"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { ErrorAlert } from "@/app/components/alerts";
import { LoadingSpinner } from "@/app/components/loading";

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

  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

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
      setRouting(null);
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
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />

        <main className="flex flex-1 items-center justify-center px-6 py-8">
          <LoadingSpinner />
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-3xl">

          {/* Header */}
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Nove narudžbine
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Novi radni nalog
            </h1>

            <p className="mt-2 text-gray-700">
              Kreiraj novi radni nalog za proizvodnju proizvoda
            </p>
          </div>

          {/* Form Card */}
          <div className="overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* Error Alert */}
            {error && (
              <div className="border-b border-red-200 bg-red-50 px-6 py-4">
                <ErrorAlert message={error} />
              </div>
            )}

            <div className="p-8">

              {/* Product Selection */}
              <div className="mb-8">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-900">
                  Proizvod *
                </label>

                <div
                  ref={dropdownRef}
                  className="relative"
                >
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() =>
                      setDropdownOpen(
                        (value) => !value,
                      )
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <span
                      className={
                        selectedProduct
                          ? "text-gray-900"
                          : "text-gray-500"
                      }
                    >
                      {selectedProduct
                        ? `${selectedProduct.code} — ${selectedProduct.name}`
                        : "Izaberi proizvod..."}
                    </span>

                    <span className="ml-3 shrink-0 text-gray-500">
                      {dropdownOpen
                        ? "▲"
                        : "▼"}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1 max-h-[500px] w-full overflow-y-auto rounded-lg border border-gray-300 bg-white py-1 shadow-lg">
                      {products.map(
                        (product) => {
                          const selected =
                            product.id ===
                            selectedProductId;

                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                setSelectedProductId(
                                  product.id,
                                );
                                setError("");
                                setDropdownOpen(
                                  false,
                                );
                              }}
                              className={`block w-full px-3 py-2.5 text-left text-sm transition-colors ${
                                selected
                                  ? "bg-blue-50 font-medium text-blue-700"
                                  : "text-gray-900 hover:bg-blue-50"
                              }`}
                            >
                              {product.code} —{" "}
                              {product.name}
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info Cards */}
              {selectedProduct && (
                <div className="mb-8 grid gap-4 md:grid-cols-2">

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                      Šifra proizvoda
                    </p>

                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {selectedProduct.code}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                      Revizija
                    </p>

                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {selectedProduct.revision}
                    </p>
                  </div>

                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-900">
                  Količina *
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>

              {/* Routing Section */}
              <div className="mb-8">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Proizvodni proces
                  </h2>

                  <p className="mt-1 text-sm text-gray-700">
                    Operacije koje će biti kreirane za radni nalog
                  </p>
                </div>

                {loadingRouting && (
                  <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8">
                    <LoadingSpinner />
                  </div>
                )}

                {!selectedProductId &&
                  !loadingRouting && (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-700">
                      <p className="text-base">
                        Izaberi proizvod da prikaže proizvodni proces
                      </p>
                    </div>
                  )}

                {!loadingRouting &&
                  selectedProductId &&
                  routing &&
                  routing.operations.length > 0 && (
                    <div className="space-y-3">
                      {routing.operations.map(
                        (
                          operation,
                          index,
                        ) => (
                          <div
                            key={
                              operation.id
                            }
                            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-semibold text-blue-600">
                              {index + 1}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900">
                                {
                                  operation.name
                                }
                              </div>

                              <div className="mt-0.5 text-xs text-gray-700">
                                {
                                  operation.type
                                }
                              </div>
                            </div>

                            <div className="whitespace-nowrap text-right text-xs text-gray-700">
                              {operation.setupTime !==
                                null && (
                                <div>
                                  Setup:{" "}
                                  {
                                    operation.setupTime
                                  }{" "}
                                  min
                                </div>
                              )}

                              {operation.cycleTime !==
                                null && (
                                <div>
                                  Ciklus:{" "}
                                  {
                                    operation.cycleTime
                                  }{" "}
                                  min
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
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                      Za ovaj proizvod nije pronađen proizvodni proces
                    </div>
                  )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 border-t border-gray-200 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    router.back()
                  }
                  disabled={creating}
                  className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Otkaži
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
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating
                    ? "Kreiranje..."
                    : "Kreiraj nalog"}
                </button>

              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}