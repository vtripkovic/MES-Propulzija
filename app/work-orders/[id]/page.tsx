"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { ErrorAlert } from "@/app/components/alerts";
import { LoadingSpinner } from "@/app/components/loading";

type Operation = {
  id: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  actualTime: number | null;
  operation: {
    id: string;
    sequence: number;
    name: string;
    type: string;
  };
  machine: {
    id: string;
    name: string;
    code: string;
  } | null;
};

type WorkOrderItem = {
  id: string;
  productId: string;
  parentItemId: string | null;
  quantity: number;
  product: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
  parentItem: {
    id: string;
    product: {
      id: string;
      code: string;
      name: string;
    };
  } | null;
  childItems: {
    id: string;
    product: {
      id: string;
      code: string;
      name: string;
    };
  }[];
  operations: Operation[];
};

type WorkOrder = {
  id: string;
  number: string;
  quantity: number;
  status: string;
  product: {
    code: string;
    name: string;
    description: string | null;
  };
  operations: Operation[];
  items: WorkOrderItem[];
};

const statusLabels: Record<string, string> = {
  PLANNED: "PLANIRANO",
  IN_PROGRESS: "U TOKU",
  WAITING: "ČEKA",
  READY: "SPREMNO",
  RUNNING: "U TOKU",
  COMPLETED: "ZAVRŠENO",
};

function getStatusClasses(status: string) {
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "RUNNING") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "READY") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

export default function WorkOrderPage() {
  const params = useParams();
  const id = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWorkOrder() {
      try {
        const response = await fetch(`/api/work-orders/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Greška pri učitavanju radnog naloga");
        }

        const data = await response.json();

        if (!cancelled) {
          setWorkOrder(data);
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

    void loadWorkOrder();

    const interval = setInterval(() => {
      void loadWorkOrder();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  async function deleteWorkOrder() {
    if (!workOrder) {
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `/api/work-orders/${workOrder.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Greška pri brisanju radnog naloga",
        );
      }

      router.push("/production");
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Greška pri brisanju radnog naloga",
      );
      setDeleting(false);
    }
  }

  if (loading) {
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

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center px-6 py-8">
          <ErrorAlert message={error} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center px-6 py-8">
          <ErrorAlert message="Radni nalog nije pronađen." />
        </main>
        <Footer />
      </div>
    );
  }

  const allOperations = workOrder.operations;

  const completed = allOperations.filter(
    (operation) => operation.status === "COMPLETED",
  ).length;

  const total = allOperations.length;

  const progress =
    total > 0
      ? Math.round((completed / total) * 100)
      : 0;

  const calculatedStatus =
    total > 0 && completed === total
      ? "COMPLETED"
      : allOperations.some(
            (operation) =>
              operation.status === "RUNNING" ||
              operation.status === "READY" ||
              operation.status === "COMPLETED",
          )
        ? "IN_PROGRESS"
        : "PLANNED";

  /*
   * WorkOrderItem redosled je već redosledom kreiranja
   * u kojem je prvo glavni proizvod, a zatim njegovi
   * podsklopovi i delovi.
   *
   * Ovde dodatno sortiramo tako da:
   * 1. glavni proizvod bude prvi
   * 2. zatim podsklopovi/delovi po createdAt redosledu
   */
  const rootItem = workOrder.items.find(
    (item) => item.parentItemId === null,
  );

  const childItems = workOrder.items.filter(
    (item) => item.parentItemId !== null,
  );

  const orderedItems = rootItem
    ? [rootItem, ...childItems]
    : workOrder.items;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/production"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Nazad na proizvodnju
            </Link>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Radni nalog
                </p>

                <h1 className="mt-2 text-4xl font-bold text-gray-900">
                  {workOrder.number}
                </h1>

                <p className="mt-2 text-lg text-gray-700">
                  {workOrder.product.name}
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <div
                  className={`rounded-lg border px-4 py-2 text-center text-sm font-bold transition-colors ${
                    calculatedStatus === "COMPLETED"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : calculatedStatus === "IN_PROGRESS"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {statusLabels[calculatedStatus] ??
                    calculatedStatus}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteError("");
                    setShowDeleteModal(true);
                  }}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
                >
                  Obriši radni nalog
                </button>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <InfoCard
              icon="📦"
              label="Proizvod"
              value={workOrder.product.code}
              subtitle={workOrder.product.name}
            />

            <InfoCard
              icon="📊"
              label="Količina"
              value={String(workOrder.quantity)}
              subtitle="jedinica"
            />

            <InfoCard
              icon="✓"
              label="Operacije"
              value={`${completed}/${total}`}
              subtitle="završenih"
            />
          </div>

          {/* Progress */}
          <section className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Napredak proizvodnje
                  </h2>

                  <p className="mt-1 text-sm text-gray-700">
                    {completed} od {total} operacija završeno
                  </p>
                </div>

                <div className="text-3xl font-bold text-green-600">
                  {progress}%
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>

          {/* Operations */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Operacije proizvodnje
              </h2>

              <p className="mt-1 text-gray-700">
                Operacije su grupisane po proizvodu, podsklopu i delu
              </p>
            </div>

            <div className="space-y-8">
              {orderedItems.map((item) => (
                <div key={item.id}>
                  {/* Product / Assembly heading */}
                  <div className="mb-3 flex flex-col gap-1 border-b border-gray-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {item.product.name}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-gray-500">
                        {item.product.code}
                      </p>
                    </div>

                    <div className="text-sm text-gray-500">
                      Količina:{" "}
                      <span className="font-semibold text-gray-700">
                        {item.quantity}
                      </span>
                    </div>
                  </div>

                  {item.operations.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-5 py-4 text-sm text-gray-500">
                      Za ovaj proizvod nije definisana nijedna
                      operacija.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {item.operations
                        .slice()
                        .sort(
                          (a, b) =>
                            a.operation.sequence -
                            b.operation.sequence,
                        )
                        .map((operation) => (
                          <div
                            key={operation.id}
                            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                              {/* Sequence */}
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg font-bold text-blue-600">
                                {operation.operation.sequence}
                              </div>

                              {/* Operation Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h4 className="font-bold text-gray-900">
                                    {operation.operation.name}
                                  </h4>

                                  <span
                                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${getStatusClasses(
                                      operation.status,
                                    )}`}
                                  >
                                    {statusLabels[
                                      operation.status
                                    ] ?? operation.status}
                                  </span>
                                </div>

                                <p className="mt-1 text-sm text-gray-700">
                                  Tip: {operation.operation.type}
                                </p>
                              </div>

                              {/* Machine */}
                              <div className="min-w-fit">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  Mašina
                                </p>

                                {operation.machine ? (
                                  <>
                                    <p className="mt-1 font-semibold text-gray-900">
                                      {operation.machine.name}
                                    </p>

                                    <p className="text-xs text-gray-700">
                                      {operation.machine.code}
                                    </p>
                                  </>
                                ) : (
                                  <p className="mt-1 text-gray-500">
                                    Nije potrebna
                                  </p>
                                )}
                              </div>

                              {/* Time */}
                              <div className="min-w-fit">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  Vreme
                                </p>

                                <p className="mt-1 font-semibold text-gray-900">
                                  {operation.actualTime !== null
                                    ? `${operation.actualTime} min`
                                    : "—"}
                                </p>
                              </div>

                              {/* Action */}
                              <div>
                                <Link
                                  href={`/work-orders/${workOrder.id}/operations/${operation.id}`}
                                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                  Detalji →
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Completion Message */}
          {calculatedStatus === "COMPLETED" && (
            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
              <div className="text-5xl">✓</div>

              <h2 className="mt-3 text-2xl font-bold text-green-700">
                Radni nalog je završen!
              </h2>

              <p className="mt-2 text-green-600">
                Sve operacije proizvodnje su uspešno završene.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
              Obriši radni nalog?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-700">
              Da li ste sigurni da želite da obrišete radni nalog{" "}
              <span className="font-semibold text-gray-900">
                {workOrder.number}
              </span>
              ?
            </p>

            <p className="mt-2 text-sm text-red-600">
              Ova akcija će obrisati radni nalog i sva njegova
              izvršenja operacija. Akcija se ne može poništiti.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setShowDeleteModal(false);
                    setDeleteError("");
                  }
                }}
                disabled={deleting}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Otkaži
              </button>

              <button
                type="button"
                onClick={deleteWorkOrder}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Brisanje..." : "Obriši radni nalog"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{icon}</div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
          </p>

          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-700">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}