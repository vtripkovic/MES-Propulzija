"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type Machine = {
  id: string;
  code: string;
  name: string;
  department: {
    id: string;
    code: string;
    name: string;
  };
  operationExecutions?: OperationExecution[];
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
  machine: {
    id: string;
    name: string;
    code: string;
  } | null;
  workOrder: WorkOrder;
};

type WorkOrder = {
  id: string;
  number: string;
  quantity: number;
  status: string;
  product: Product;
};

type DashboardWorkOrder = WorkOrder & {
  operations: OperationExecution[];
};

export default function ProductionPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workOrders, setWorkOrders] = useState<
    DashboardWorkOrder[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      const [machinesResponse, workOrdersResponse] =
        await Promise.all([
          fetch("/api/machines", {
            cache: "no-store",
          }),

          fetch("/api/work-orders", {
            cache: "no-store",
          }),
        ]);

      if (!machinesResponse.ok) {
        throw new Error("Greška pri učitavanju mašina");
      }

      if (!workOrdersResponse.ok) {
        throw new Error(
          "Greška pri učitavanju radnih naloga",
        );
      }

      const machinesData =
        await machinesResponse.json();

      const workOrdersData =
        await workOrdersResponse.json();

      setMachines(
        machinesData.value ?? machinesData,
      );

      setWorkOrders(
        workOrdersData.value ?? workOrdersData,
      );

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nepoznata greška",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  const load = () => {
    void loadDashboard();
  };

  load();

  const interval = setInterval(load, 10000);

  return () => {
    clearInterval(interval);
  };
}, []);

  const runningMachines = machines.filter(
    (machine) =>
      machine.operationExecutions?.some(
        (execution) =>
          execution.status === "RUNNING",
      ),
  );

  const freeMachines = machines.filter(
    (machine) =>
      !machine.operationExecutions?.some(
        (execution) =>
          execution.status === "RUNNING",
      ),
  );

  const runningOperations = workOrders.flatMap(
    (workOrder) =>
      workOrder.operations
        .filter(
          (operation) =>
            operation.status === "RUNNING",
        )
        .map((operation) => ({
          ...operation,
          workOrder,
        })),
  );

  const readyOperations = workOrders.flatMap(
    (workOrder) =>
      workOrder.operations
        .filter(
          (operation) =>
            operation.status === "READY",
        )
        .map((operation) => ({
          ...operation,
          workOrder,
        })),
  );

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              MES Sistem
            </p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Tabla proizvodnje
            </h1>
            <p className="mt-2 text-gray-700">
              Trenutno stanje svih proizvodnih kapaciteta i operacija
            </p>
          </div>

          {/* Error State */}
          {error && <ErrorAlert message={error} />}

          {/* Summary Stats */}
          <section className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="Mašine" value={machines.length} icon="🏭" />
            <SummaryCard
              label="U radu"
              value={runningMachines.length}
              icon="⚙️"
              highlight="green"
            />
            <SummaryCard
              label="Slobodne"
              value={freeMachines.length}
              icon="✓"
              highlight="gray"
            />
            <SummaryCard
              label="Operacije u toku"
              value={runningOperations.length}
              icon="▶️"
              highlight="green"
            />
            <SummaryCard
              label="Spremne operacije"
              value={readyOperations.length}
              icon="→"
              highlight="blue"
            />
          </section>

          {/* Machines Section */}
          <section className="mb-8">
            <div className="mb-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 -my-8 px-6 py-4 md:-mx-8 md:px-8">
              <h2 className="text-xl font-bold text-gray-900">
                Proizvodne mašine
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Trenutno stanje i aktivne operacije
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {machines.map((machine) => (
                <MachineCard key={machine.id} machine={machine} />
              ))}
            </div>
          </section>

          {/* Running Operations Section */}
          <section className="mb-8">
            <div className="mb-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 -mx-6 -my-8 px-6 py-4 md:-mx-8 md:px-8">
              <h2 className="text-xl font-bold text-gray-900">
                Operacije u toku
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Poslovi koji se trenutno izvršavaju
              </p>
            </div>

            {runningOperations.length === 0 ? (
              <EmptyState text="Nema operacija u toku" />
            ) : (
              <div className="space-y-3">
                {runningOperations.map((operation) => (
                  <RunningOperation key={operation.id} operation={operation} />
                ))}
              </div>
            )}
          </section>

          {/* Ready Operations Section */}
          <section className="mb-8">
            <div className="mb-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 -mx-6 -my-8 px-6 py-4 md:-mx-8 md:px-8">
              <h2 className="text-xl font-bold text-gray-900">
                Spremne operacije
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Čekaju pokretanje na mašini
              </p>
            </div>

            {readyOperations.length === 0 ? (
              <EmptyState text="Nema operacija spremnih za izvršenje" />
            ) : (
              <div className="space-y-3">
                {readyOperations.map((operation) => (
                  <ReadyOperation
                    key={operation.id}
                    operation={operation}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Work Orders Section */}
          <section>
            <div className="mb-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 -mx-6 -my-8 px-6 py-4 md:-mx-8 md:px-8">
              <h2 className="text-xl font-bold text-gray-900">
                Radni nalozi
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Pregled napretka aktivnih naloga
              </p>
            </div>

            <div className="space-y-4">
              {workOrders.map((workOrder) => (
                <WorkOrderCard
                  key={workOrder.id}
                  workOrder={workOrder}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: "green" | "blue" | "gray";
}) {
  const bgClass =
    highlight === "green"
      ? "bg-green-50 border-green-200"
      : highlight === "blue"
        ? "bg-blue-50 border-blue-200"
        : "bg-white border-gray-200";

  const valueClass =
    highlight === "green"
      ? "text-green-600"
      : highlight === "blue"
        ? "text-blue-600"
        : "text-gray-900";

  return (
    <div
      className={`rounded-lg border ${bgClass} p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            {label}
          </p>
          <p className={`mt-2 text-2xl font-bold ${valueClass}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MACHINE CARD                                                               */
/* -------------------------------------------------------------------------- */

function MachineCard({
  machine,
}: {
  machine: Machine;
}) {
  const activeExecution = machine.operationExecutions?.find(
    (execution) => execution.status === "RUNNING",
  );

  const isRunning = Boolean(activeExecution);

  return (
    <Link
      href={`/machines/${machine.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {machine.code}
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {machine.name}
          </div>
          <div className="mt-1 text-sm text-gray-700">
            {machine.department.name}
          </div>
        </div>

        <div className="flex-shrink-0">
          <StatusBadge status={isRunning ? "RUNNING" : "FREE"} />
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        {activeExecution ? (
          <>
            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Operacija
            </p>
            <p className="mt-1 font-semibold text-gray-900">
              {activeExecution.operation.name}
            </p>
            <p className="mt-1 text-xs text-gray-700">
              {activeExecution.workOrder.number} ·{" "}
              {activeExecution.workOrder.product.name}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Slobodna mašina</p>
        )}
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* RUNNING OPERATION                                                          */
/* -------------------------------------------------------------------------- */

function RunningOperation({
  operation,
}: {
  operation: OperationExecution & {
    workOrder: DashboardWorkOrder;
  };
}) {
  return (
    <Link
      href={`/work-orders/${operation.workOrder.id}/operations/${operation.id}`}
      className="block rounded-lg border border-green-200 bg-green-50 p-5 shadow-sm hover:shadow-md hover:border-green-300 transition-all"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            {operation.workOrder.number}
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {operation.operation.name}
          </div>
          <div className="mt-1 text-sm text-gray-700">
            {operation.workOrder.product.name}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status="RUNNING" />
          <div className="text-sm text-gray-700 whitespace-nowrap">
            {operation.machine?.name ?? "Mašina nisu dodata"}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* READY OPERATION                                                            */
/* -------------------------------------------------------------------------- */

function ReadyOperation({
  operation,
}: {
  operation: OperationExecution & {
    workOrder: DashboardWorkOrder;
  };
}) {
  return (
    <Link
      href={`/work-orders/${operation.workOrder.id}/operations/${operation.id}`}
      className="block rounded-lg border border-orange-200 bg-orange-50 p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition-all"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
            {operation.workOrder.number}
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {operation.operation.name}
          </div>
          <div className="mt-1 text-sm text-gray-700">
            {operation.workOrder.product.name}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status="READY" />
          <div className="text-sm text-gray-700 whitespace-nowrap">
            {operation.machine?.name ?? "Izbor mašine potreban"}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* WORK ORDER CARD                                                            */
/* -------------------------------------------------------------------------- */

function WorkOrderCard({
  workOrder,
}: {
  workOrder: DashboardWorkOrder;
}) {
  const total = workOrder.operations.length;

  const completed = workOrder.operations.filter(
    (operation) => operation.status === "COMPLETED",
  ).length;

  const running = workOrder.operations.filter(
    (operation) => operation.status === "RUNNING",
  ).length;

  const progress =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Link
      href={`/work-orders/${workOrder.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-bold text-gray-900">
              {workOrder.number}
            </span>
            <StatusBadge status={workOrder.status} />
          </div>

          <div className="mt-2 text-sm text-gray-700">
            {workOrder.product.name}
          </div>

          <div className="mt-1 text-xs text-gray-700">
            {workOrder.product.code} · Količina: {workOrder.quantity}
          </div>
        </div>

        <div className="w-full lg:w-80">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-700">
            <span>Napredak</span>
            <span>
              {completed}/{total}
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-1 flex justify-between text-xs text-gray-700">
            <span>{progress}% završeno</span>
            {running > 0 && (
              <span className="font-medium text-green-600">
                {running} u toku
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* STATUS                                                                     */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    RUNNING:
      "bg-green-100 text-green-700",

    READY:
      "bg-blue-100 text-blue-700",

    WAITING:
      "bg-gray-100 text-gray-700",

    COMPLETED:
      "bg-gray-100 text-gray-700",

    PLANNED:
      "bg-gray-100 text-gray-700",

    IN_PROGRESS:
      "bg-yellow-100 text-yellow-700",

    FREE:
      "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
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
    case "RUNNING":
      return "U TOKU";

    case "READY":
      return "SPREMNO";

    case "WAITING":
      return "ČEKA";

    case "COMPLETED":
      return "ZAVRŠENO";

    case "PLANNED":
      return "PLANIRANO";

    case "IN_PROGRESS":
      return "U PROIZVODNJI";

    case "FREE":
      return "SLOBODNA";

    default:
      return status;
  }
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-700">
      <div className="text-3xl mb-2">—</div>
      {text}
    </div>
  );
}
