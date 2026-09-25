"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { ErrorAlert } from "@/app/components/alerts";
import { LoadingSpinner } from "@/app/components/loading";

type Operation = {
  id: string;
  status: string;
  operation: {
    id: string;
    sequence: number;
    name: string;
    type: string;
  };
};

type WorkOrder = {
  id: string;
  number: string;
  quantity: number;
  status: string;
  createdAt: string;
  product: {
    code: string;
    name: string;
  };
  operations: Operation[];
};

type Product = {
  id: string;
  code: string;
  name: string;
};

const statusLabels: Record<string, string> = {
  PLANNED: "Planiran",
  IN_PROGRESS: "U proizvodnji",
  COMPLETED: "Završen",
};

function getWorkOrderStatus(
  workOrder: WorkOrder,
): string {
  const total = workOrder.operations.length;

  const completed = workOrder.operations.filter(
    (operation) =>
      operation.status === "COMPLETED",
  ).length;

  if (total > 0 && completed === total) {
    return "COMPLETED";
  }

  const hasStartedOperation =
    workOrder.operations.some(
      (operation) =>
        operation.status === "RUNNING" ||
        operation.status === "READY" ||
        operation.status === "COMPLETED",
    );

  if (hasStartedOperation) {
    return "IN_PROGRESS";
  }

  return "PLANNED";
}

function getStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";

    case "PLANNED":
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function WorkOrdersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query =
    searchParams.get("query") ?? "";

  const status =
    searchParams.get("status") ?? "ALL";

  const productId =
    searchParams.get("productId") ?? "";

  const pageParam = Number(
    searchParams.get("page") ?? "1",
  );

  const page =
    Number.isInteger(pageParam) && pageParam > 0
      ? pageParam
      : 1;

  const limit = 10;

  const [workOrders, setWorkOrders] =
    useState<WorkOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [products, setProducts] =
    useState<Product[]>([]);

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  /*
   * Učitavanje proizvoda za filter
   */
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setProductsLoading(true);

        const response = await fetch(
          "/api/products",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Greška pri učitavanju proizvoda.",
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setProducts(data);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Učitavanje radnih naloga
   */
  useEffect(() => {
    let cancelled = false;

    async function loadWorkOrders() {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (query) {
          params.set("query", query);
        }

        if (status && status !== "ALL") {
          params.set("status", status);
        }

        if (productId) {
          params.set("productId", productId);
        }

        params.set("page", String(page));
        params.set("limit", String(limit));

        const response = await fetch(
          `/api/work-orders?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Greška pri učitavanju radnih naloga.",
          );
        }

        if (!cancelled) {
          setWorkOrders(data.data);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          setError("");
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Greška pri učitavanju radnih naloga.",
          );

          setWorkOrders([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkOrders();

    return () => {
      cancelled = true;
    };
  }, [
    query,
    status,
    productId,
    page,
  ]);

  /*
   * Pretraga
   */
  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget,
    );

    const searchValue = String(
      formData.get("query") ?? "",
    ).trim();

    const params =
      new URLSearchParams(searchParams);

    if (searchValue) {
      params.set("query", searchValue);
    } else {
      params.delete("query");
    }

    /*
     * Kada menjamo filter,
     * vraćamo se na prvu stranu.
     */
    params.delete("page");

    router.push(
      params.toString()
        ? `/work-orders?${params.toString()}`
        : "/work-orders",
    );
  }

  /*
   * Promena status filtera
   */
  function handleStatusChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const newStatus = event.target.value;

    const params =
      new URLSearchParams(searchParams);

    if (
      newStatus &&
      newStatus !== "ALL"
    ) {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }

    /*
     * Kada menjamo filter,
     * vraćamo se na prvu stranu.
     */
    params.delete("page");

    router.push(
      params.toString()
        ? `/work-orders?${params.toString()}`
        : "/work-orders",
    );
  }

  /*
   * Promena proizvoda
   */
  function handleProductChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const newProductId =
      event.target.value;

    const params =
      new URLSearchParams(searchParams);

    if (newProductId) {
      params.set(
        "productId",
        newProductId,
      );
    } else {
      params.delete("productId");
    }

    /*
     * Kada menjamo filter,
     * vraćamo se na prvu stranu.
     */
    params.delete("page");

    router.push(
      params.toString()
        ? `/work-orders?${params.toString()}`
        : "/work-orders",
    );
  }

  /*
   * Promena stranice
   */
  function goToPage(newPage: number) {
    if (
      newPage < 1 ||
      newPage > totalPages
    ) {
      return;
    }

    const params =
      new URLSearchParams(searchParams);

    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set(
        "page",
        String(newPage),
      );
    }

    router.push(
      params.toString()
        ? `/work-orders?${params.toString()}`
        : "/work-orders",
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Radni nalozi
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                Pregled i praćenje proizvodnih
                radnih naloga
              </p>
            </div>

            <Link
              href="/work-orders/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              + Novi radni nalog
            </Link>
          </div>

          {/* Filteri */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Pretraga i filteri
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Filtriraj radne naloge po broju,
                proizvodu ili statusu.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Pretraga */}
              <form
                onSubmit={handleSearch}
                className="lg:col-span-1"
              >
                <label
                  htmlFor="query"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Pretraga
                </label>

                <div className="flex gap-2">
                  <input
                    id="query"
                    name="query"
                    type="text"
                    defaultValue={query}
                    placeholder="Broj naloga, šifra ili naziv..."
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="submit"
                    className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    Pretraži
                  </button>
                </div>
              </form>

              {/* Proizvod */}
              <div>
                <label
                  htmlFor="productId"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Proizvod
                </label>

                <select
                  id="productId"
                  value={productId}
                  onChange={handleProductChange}
                  disabled={productsLoading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    Svi proizvodi
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.code} –{" "}
                        {product.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={status}
                  onChange={handleStatusChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ALL">
                    Svi statusi
                  </option>

                  <option value="PLANNED">
                    Planiran
                  </option>

                  <option value="IN_PROGRESS">
                    U proizvodnji
                  </option>

                  <option value="COMPLETED">
                    Završen
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Greška */}
          {error && (
            <div className="mb-6">
              <ErrorAlert message={error} />
            </div>
          )}

          {/* Lista */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : workOrders.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 text-4xl">
                  📋
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  Nema radnih naloga
                </h3>

                <p className="mt-1 max-w-md text-sm text-gray-600">
                  Za zadate kriterijume nije
                  pronađen nijedan radni nalog.
                </p>
              </div>
            ) : (
              <>
                {/* Naslov liste */}
                <div className="border-b border-gray-200 px-5 py-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-base font-semibold text-gray-900">
                      Radni nalozi
                    </h2>

                    <p className="text-sm text-gray-600">
                      Strana{" "}
                      <span className="font-semibold text-gray-900">
                        {page}
                      </span>{" "}
                      od{" "}
                      <span className="font-semibold text-gray-900">
                        {totalPages}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                          Radni nalog
                        </th>

                        <th
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                          Proizvod
                        </th>

                        <th
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                          Količina
                        </th>

                        <th
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                          Operacije
                        </th>

                        <th
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                          Status
                        </th>

                        <th
                          scope="col"
                          className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                          Akcija
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {workOrders.map(
                        (workOrder) => {
                          const calculatedStatus =
                            getWorkOrderStatus(
                              workOrder,
                            );

                          const completed =
                            workOrder.operations.filter(
                              (operation) =>
                                operation.status ===
                                "COMPLETED",
                            ).length;

                          const totalOperations =
                            workOrder.operations.length;

                          return (
                            <tr
                              key={
                                workOrder.id
                              }
                              className="transition-colors hover:bg-gray-50"
                            >
                              {/* Radni nalog */}
                              <td className="whitespace-nowrap px-5 py-4">
                                <div className="font-semibold text-gray-900">
                                  {
                                    workOrder.number
                                  }
                                </div>

                                <div className="mt-1 text-xs text-gray-500">
                                  {new Date(
                                    workOrder.createdAt,
                                  ).toLocaleDateString(
                                    "sr-RS",
                                  )}
                                </div>
                              </td>

                              {/* Proizvod */}
                              <td className="px-5 py-4">
                                <div className="font-medium text-gray-900">
                                  {
                                    workOrder
                                      .product
                                      .name
                                  }
                                </div>

                                <div className="mt-1 text-sm text-gray-600">
                                  {
                                    workOrder
                                      .product
                                      .code
                                  }
                                </div>
                              </td>

                              {/* Količina */}
                              <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                {workOrder.quantity.toLocaleString(
                                  "sr-RS",
                                )}
                              </td>

                              {/* Operacije */}
                              <td className="whitespace-nowrap px-5 py-4">
                                <div className="text-sm text-gray-700">
                                  <span className="font-semibold text-gray-900">
                                    {
                                      completed
                                    }
                                  </span>
                                  {" / "}
                                  {
                                    totalOperations
                                  }
                                </div>

                                {totalOperations >
                                  0 && (
                                  <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                      className="h-full rounded-full bg-blue-600"
                                      style={{
                                        width: `${
                                          (completed /
                                            totalOperations) *
                                          100
                                        }%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </td>

                              {/* Status */}
                              <td className="whitespace-nowrap px-5 py-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                    calculatedStatus,
                                  )}`}
                                >
                                  {
                                    statusLabels[
                                      calculatedStatus
                                    ]
                                  }
                                </span>
                              </td>

                              {/* Akcija */}
                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                <Link
                                  href={`/work-orders/${workOrder.id}`}
                                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                  Detaljno
                                </Link>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer + pagination */}
                <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    Ukupno radnih naloga:{" "}
                    <span className="font-semibold text-gray-900">
                      {total}
                    </span>
                  </p>

                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {/* Prethodna */}
                      <button
                        type="button"
                        onClick={() =>
                          goToPage(
                            page - 1,
                          )
                        }
                        disabled={
                          page === 1
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ← Prethodna
                      </button>

                      {/* Brojevi stranica */}
                      {Array.from(
                        {
                          length:
                            totalPages,
                        },
                        (_, index) =>
                          index + 1,
                      ).map(
                        (pageNumber) => (
                          <button
                            key={
                              pageNumber
                            }
                            type="button"
                            onClick={() =>
                              goToPage(
                                pageNumber,
                              )
                            }
                            className={`min-w-9 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                              pageNumber ===
                              page
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {
                              pageNumber
                            }
                          </button>
                        ),
                      )}

                      {/* Sledeća */}
                      <button
                        type="button"
                        onClick={() =>
                          goToPage(
                            page + 1,
                          )
                        }
                        disabled={
                          page ===
                          totalPages
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Sledeća →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}