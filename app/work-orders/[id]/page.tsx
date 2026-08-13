"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

function getStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";

    case "RUNNING":
      return "bg-blue-100 text-blue-800 border-blue-200";

    case "READY":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";

    case "WAITING":
      return "bg-gray-100 text-gray-700 border-gray-200";

    case "PLANNED":
      return "bg-gray-100 text-gray-700 border-gray-200";

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getOperationIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return "✓";

    case "RUNNING":
      return "▶";

    case "READY":
      return "→";

    default:
      return "○";
  }
}

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
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">
          Učitavanje...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Greška: {error}
        </div>
      </main>
    );
  }

  if (!workOrder) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Radni nalog nije pronađen.</p>
      </main>
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
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-500">
              Radni nalog
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {workOrder.number}
            </h1>

            <h2 className="mt-2 text-xl font-semibold text-gray-700">
              {workOrder.product.name}
            </h2>

            <p className="mt-1 text-gray-500">
              Šifra proizvoda: {workOrder.product.code}
            </p>
          </div>

          <div
            className={`rounded-xl border px-5 py-3 text-center text-sm font-bold ${getStatusClass(
              calculatedStatus,
            )}`}
          >
            {statusLabels[calculatedStatus] ??
              calculatedStatus}
          </div>
        </div>

        {/* BASIC INFORMATION */}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            label="Proizvod"
            value={workOrder.product.name}
          />

          <InfoCard
            label="Količina"
            value={String(workOrder.quantity)}
          />

          <InfoCard
            label="Operacije"
            value={`${completed} / ${total}`}
          />
        </div>

        {/* PROGRESS */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Napredak proizvodnje
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {completed} od {total} operacija završeno
              </p>
            </div>

            <div className="text-3xl font-bold text-gray-900">
              {progress}%
            </div>
          </div>

          <div className="h-5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* OPERATIONS */}

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Operacije proizvodnje
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Operacije se izvršavaju redosledom definisanim u
              radnom nalogu.
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
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

                    {/* SEQUENCE */}

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-700">
                      {operation.operation.sequence}
                    </div>

                    {/* OPERATION */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {operation.operation.name}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                            operation.status,
                          )}`}
                        >
                          {getOperationIcon(
                            operation.status,
                          )}{" "}
                          {statusLabels[
                            operation.status
                          ] ?? operation.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {operation.operation.type}
                      </p>
                    </div>

                    {/* MACHINE */}

                    <div className="min-w-[220px]">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Mašina
                      </p>

                      {operation.machine ? (
                        <>
                          <p className="mt-1 font-semibold text-gray-800">
                            {operation.machine.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {operation.machine.code}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-gray-400">
                          Nije potrebna
                        </p>
                      )}
                    </div>

                    {/* TIME */}

                    <div className="min-w-[110px]">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Vreme
                      </p>

                      <p className="mt-1 font-semibold text-gray-800">
                        {operation.actualTime !== null
                          ? `${operation.actualTime} min`
                          : "—"}
                      </p>
                    </div>

                    {/* BUTTON */}

                    <div>
                      <Link
                        href={`/work-orders/${workOrder.id}/operations/${operation.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-700"
                      >
                        Otvori
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* COMPLETED MESSAGE */}

        {calculatedStatus === "COMPLETED" && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <div className="text-4xl">✓</div>

            <h2 className="mt-3 text-2xl font-bold text-green-800">
              Radni nalog je završen
            </h2>

            <p className="mt-2 text-green-700">
              Sve operacije proizvodnje su uspešno završene.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}