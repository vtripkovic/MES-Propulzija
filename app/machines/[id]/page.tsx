"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Department = {
  id: string;
  code: string;
  name: string;
};

type Product = {
  id: string;
  code: string;
  name: string;
  revision: string;
};

type Routing = {
  id: string;
  revision: string;
  product: Product;
};

type Operation = {
  id: string;
  sequence: number;
  name: string;
  type: string;
  setupTime: number | null;
  cycleTime: number | null;
  routing: Routing;
};

type OperationMachine = {
  id: string;
  operation: Operation;
};

type WorkOrder = {
  id: string;
  number: string;
  quantity: number;
  status: string;
  product: Product;
};

type OperationExecution = {
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
  workOrder: WorkOrder;
};

type Machine = {
  id: string;
  code: string;
  name: string;
  department: Department;

  operationMachines: OperationMachine[];

  operationExecutions: OperationExecution[];
};

export default function MachinePage() {
  const params = useParams();

  const machineId = params.id as string;

  const [machine, setMachine] =
    useState<Machine | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMachine() {
      try {
        const response = await fetch(
          `/api/machines/${machineId}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Greška pri učitavanju mašine",
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setMachine(data);
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

    void loadMachine();

    return () => {
      cancelled = true;
    };
  }, [machineId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-700">
          Učitavanje mašine...
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

  if (!machine) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-700">
          Mašina nije pronađena.
        </div>
      </main>
    );
  }

  const executions =
    machine.operationExecutions ?? [];

  const activeExecutions = executions.filter(
    (execution) =>
      execution.status === "RUNNING",
  );

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8">
          <Link
            href="/machines"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Nazad na mašine
          </Link>

          <div className="mt-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {machine.code}
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                {machine.name}
              </h1>

              <p className="mt-2 text-gray-700">
                {machine.department.name}
              </p>
            </div>

            <MachineStatus
              active={activeExecutions.length > 0}
            />
          </div>
        </div>

        {/* BASIC INFO */}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <InfoCard
            label="Šifra mašine"
            value={machine.code}
          />

          <InfoCard
            label="Odeljenje"
            value={machine.department.name}
          />

          <InfoCard
            label="Dozvoljene operacije"
            value={String(
              machine.operationMachines.length,
            )}
          />
        </div>

        {/* CURRENT JOB */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Trenutna proizvodnja
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Operacije koje su trenutno pokrenute na ovoj
              mašini
            </p>
          </div>

          {activeExecutions.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
              Mašina trenutno nema aktivnu operaciju.
            </div>
          ) : (
            <div className="space-y-4">
              {activeExecutions.map(
                (execution) => (
                  <ActiveOperationCard
                    key={execution.id}
                    execution={execution}
                  />
                ),
              )}
            </div>
          )}
        </section>

        {/* ALLOWED OPERATIONS */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Operacije koje mašina može da izvršava
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Operacije povezane sa ovom mašinom kroz routing
            </p>
          </div>

          {machine.operationMachines.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
              Nema povezanih operacija.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="grid grid-cols-[70px_1fr_180px_120px_120px] gap-4 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500">
                <div>Red.</div>
                <div>Operacija</div>
                <div>Proizvod</div>
                <div>Setup</div>
                <div>Ciklus</div>
              </div>

              {machine.operationMachines.map(
                ({ id, operation }) => (
                  <div
                    key={id}
                    className="grid grid-cols-[70px_1fr_180px_120px_120px] gap-4 border-t border-gray-200 px-4 py-4"
                  >
                    <div className="font-medium text-gray-500">
                      {operation.sequence}
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">
                        {operation.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {operation.type}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-gray-800">
                        {operation.routing.product.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {operation.routing.product.code}
                      </div>
                    </div>

                    <div className="text-gray-700">
                      {operation.setupTime !== null
                        ? `${operation.setupTime} min`
                        : "-"}
                    </div>

                    <div className="text-gray-700">
                      {operation.cycleTime !== null
                        ? `${operation.cycleTime} min`
                        : "-"}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* RECENT WORK ORDERS */}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Poslednje operacije
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Poslednjih 20 izvršavanja evidentiranih na ovoj
              mašini
            </p>
          </div>

          {executions.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
              Nema evidentiranih izvršavanja.
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map(
                (execution) => (
                  <ExecutionRow
                    key={execution.id}
                    execution={execution}
                  />
                ),
              )}
            </div>
          )}
        </section>
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
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">
        {label}
      </div>

      <div className="mt-1 text-lg font-semibold text-gray-900">
        {value}
      </div>
    </div>
  );
}

function MachineStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <div
      className={
        active
          ? "rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700"
          : "rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
      }
    >
      <span className="mr-2">●</span>
      {active ? "U TOKU" : "SLOBODNA"}
    </div>
  );
}

function ActiveOperationCard({
  execution,
}: {
  execution: OperationExecution;
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-green-700">
            {execution.workOrder.number}
          </div>

          <div className="mt-1 text-xl font-bold text-gray-900">
            {execution.operation.name}
          </div>

          <div className="mt-2 text-sm text-gray-700">
            {execution.workOrder.product.name}
          </div>
        </div>

        <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
          U TOKU
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500">
            Količina
          </div>

          <div className="font-semibold">
            {execution.workOrder.quantity}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500">
            Početak
          </div>

          <div className="font-semibold">
            {execution.startedAt
              ? formatDate(execution.startedAt)
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutionRow({
  execution,
}: {
  execution: OperationExecution;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">
            {execution.workOrder.number}
          </span>

          <StatusBadge
            status={execution.status}
          />
        </div>

        <div className="mt-1 text-sm text-gray-700">
          {execution.operation.name}
          {" · "}
          {execution.workOrder.product.name}
        </div>
      </div>

      <div className="ml-4 text-right text-sm text-gray-500">
        {execution.finishedAt
          ? formatDate(execution.finishedAt)
          : execution.startedAt
            ? formatDate(execution.startedAt)
            : "-"}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    WAITING:
      "bg-gray-100 text-gray-700",
    READY:
      "bg-blue-100 text-blue-700",
    RUNNING:
      "bg-green-100 text-green-700",
    COMPLETED:
      "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "bg-gray-100 text-gray-700"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "WAITING":
      return "ČEKA";

    case "READY":
      return "SPREMNO";

    case "RUNNING":
      return "U TOKU";

    case "COMPLETED":
      return "ZAVRŠENO";

    case "PLANNED":
      return "PLANIRANO";

    default:
      return status;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}