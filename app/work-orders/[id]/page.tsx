"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
};

const statusLabels: Record<string, string> = {
  PLANNED: "PLANIRANO",
  IN_PROGRESS: "U TOKU",
  WAITING: "ČEKA",
  READY: "SPREMNO",
  RUNNING: "U TOKU",
  COMPLETED: "ZAVRŠENO",
};

export default function WorkOrderPage() {
  const params = useParams();
  const id = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <ErrorAlert message={error} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <ErrorAlert message="Radni nalog nije pronađen." />
        </main>
        <Footer />
      </div>
    );
  }

  const completed = workOrder.operations.filter(
    (operation) => operation.status === "COMPLETED",
  ).length;

  const total = workOrder.operations.length;

  const progress =
    total > 0
      ? Math.round((completed / total) * 100)
      : 0;

  const calculatedStatus =
    total > 0 && completed === total
      ? "COMPLETED"
      : workOrder.operations.some(
            (operation) =>
              operation.status === "RUNNING" ||
              operation.status === "READY" ||
              operation.status === "COMPLETED",
          )
        ? "IN_PROGRESS"
        : "PLANNED";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/production" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              ← Nazad na производњу
            </Link>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Radni nalog
                </p>
                <h1 className="mt-2 text-4xl font-bold text-gray-900">
                  {workOrder.number}
                </h1>
                <p className="mt-2 text-lg text-gray-700">
                  {workOrder.product.name}
                </p>
              </div>

              <div
                className={`rounded-lg border px-4 py-2 text-center text-sm font-bold transition-colors ${
                  calculatedStatus === "COMPLETED"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : calculatedStatus === "IN_PROGRESS"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                {statusLabels[calculatedStatus] ?? calculatedStatus}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid gap-4 mb-8 md:grid-cols-3">
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
          <section className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
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
                Operacije se izvršavaju redosledom definisanim u radnom nalogu
              </p>
            </div>

            <div className="space-y-4">
              {workOrder.operations
                .sort(
                  (a, b) =>
                    a.operation.sequence -
                    b.operation.sequence,
                )
                .map((operation) => (
                  <div
                    key={operation.id}
                    className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                      {/* Sequence */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg font-bold text-blue-600">
                        {operation.operation.sequence}
                      </div>

                      {/* Operation Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-gray-900">
                            {operation.operation.name}
                          </h3>
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                              operation.status === "COMPLETED"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : operation.status === "RUNNING"
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : operation.status === "READY"
                                    ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                    : "border-gray-200 bg-gray-50 text-gray-700"
                            }`}
                          >
                            {statusLabels[operation.status] ??
                              operation.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          Tip: {operation.operation.type}
                        </p>
                      </div>

                      {/* Machine */}
                      <div className="min-w-fit">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                          Detalji →
                        </Link>
                      </div>
                    </div>
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
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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