"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    const interval = setInterval(() => {
      void loadDashboard();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    void loadDashboard();
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
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600">
          Učitavanje proizvodnje...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              MES
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Production Board
            </h1>

            <p className="mt-2 text-gray-600">
              Trenutno stanje proizvodnje
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Radni nalozi
          </Link>
        </header>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <SummaryCard
            label="Mašine"
            value={machines.length}
          />

          <SummaryCard
            label="U radu"
            value={runningMachines.length}
            emphasis="green"
          />

          <SummaryCard
            label="Slobodne"
            value={freeMachines.length}
          />

          <SummaryCard
            label="Operacije u toku"
            value={runningOperations.length}
            emphasis="green"
          />

          <SummaryCard
            label="Spremne operacije"
            value={readyOperations.length}
            emphasis="blue"
          />

        </section>

        {/* MACHINES */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <SectionHeader
            title="Mašine"
            subtitle="Trenutno stanje proizvodnih kapaciteta"
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {machines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
              />
            ))}

          </div>

        </section>

        {/* RUNNING OPERATIONS */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <SectionHeader
            title="Operacije u toku"
            subtitle="Poslovi koji se trenutno izvršavaju"
          />

          {runningOperations.length === 0 ? (
            <EmptyState text="Trenutno nema operacija u toku." />
          ) : (
            <div className="space-y-3">
              {runningOperations.map(
                (operation) => (
                  <RunningOperation
                    key={operation.id}
                    operation={operation}
                  />
                ),
              )}
            </div>
          )}

        </section>

        {/* READY OPERATIONS */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <SectionHeader
            title="Spremne operacije"
            subtitle="Operacije koje mogu da budu pokrenute"
          />

          {readyOperations.length === 0 ? (
            <EmptyState text="Nema operacija spremnih za izvršenje." />
          ) : (
            <div className="space-y-3">
              {readyOperations.map(
                (operation) => (
                  <ReadyOperation
                    key={operation.id}
                    operation={operation}
                  />
                ),
              )}
            </div>
          )}

        </section>

        {/* WORK ORDERS */}

        <section className="rounded-2xl bg-white p-6 shadow-sm">

          <SectionHeader
            title="Radni nalozi"
            subtitle="Pregled napretka aktivnih i završenih naloga"
          />

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
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: "green" | "blue";
}) {
  let valueClass = "text-gray-900";

  if (emphasis === "green") {
    valueClass = "text-green-600";
  }

  if (emphasis === "blue") {
    valueClass = "text-blue-600";
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">
        {label}
      </div>

      <div
        className={`mt-2 text-3xl font-bold ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION HEADER                                                             */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {subtitle}
      </p>
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
  const activeExecution =
    machine.operationExecutions?.find(
      (execution) =>
        execution.status === "RUNNING",
    );

  const isRunning =
    Boolean(activeExecution);

  return (
    <Link
      href={`/machines/${machine.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">

        <div>
          <div className="text-xs font-medium text-gray-500">
            {machine.code}
          </div>

          <div className="mt-1 text-lg font-bold text-gray-900">
            {machine.name}
          </div>

          <div className="mt-1 text-sm text-gray-500">
            {machine.department.name}
          </div>
        </div>

        <StatusBadge
          status={
            isRunning
              ? "RUNNING"
              : "FREE"
          }
        />

      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">

        {activeExecution ? (
          <>
            <div className="text-xs text-gray-500">
              Trenutna operacija
            </div>

            <div className="mt-1 font-semibold text-gray-900">
              {activeExecution.operation.name}
            </div>

            <div className="mt-1 text-sm text-gray-500">
              {activeExecution.workOrder.number}
              {" · "}
              {activeExecution.workOrder.product.name}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500">
            Mašina trenutno nema aktivan posao.
          </div>
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
      className="block rounded-xl border border-green-200 bg-green-50 p-5 transition hover:border-green-300 hover:shadow-sm"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="text-sm font-medium text-green-700">
            {operation.workOrder.number}
          </div>

          <div className="mt-1 text-lg font-bold text-gray-900">
            {operation.operation.name}
          </div>

          <div className="mt-1 text-sm text-gray-600">
            {operation.workOrder.product.name}
          </div>
        </div>

        <div className="text-left md:text-right">

          <StatusBadge status="RUNNING" />

          <div className="mt-2 text-sm text-gray-500">
            {operation.machine?.name ??
              "Mašina nije izabrana"}
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
      className="block rounded-xl border border-blue-200 bg-blue-50 p-5 transition hover:border-blue-300 hover:shadow-sm"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="text-sm font-medium text-blue-700">
            {operation.workOrder.number}
          </div>

          <div className="mt-1 text-lg font-bold text-gray-900">
            {operation.operation.name}
          </div>

          <div className="mt-1 text-sm text-gray-600">
            {operation.workOrder.product.name}
          </div>
        </div>

        <div className="text-left md:text-right">

          <StatusBadge status="READY" />

          <div className="mt-2 text-sm text-gray-500">
            {operation.machine?.name ??
              "Izbor mašine potreban"}
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
    (operation) =>
      operation.status === "COMPLETED",
  ).length;

  const running = workOrder.operations.filter(
    (operation) =>
      operation.status === "RUNNING",
  ).length;

  const progress =
    total > 0
      ? Math.round((completed / total) * 100)
      : 0;

  return (
    <Link
      href={`/work-orders/${workOrder.id}`}
      className="block rounded-xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-3">

            <span className="text-lg font-bold text-gray-900">
              {workOrder.number}
            </span>

            <StatusBadge
              status={workOrder.status}
            />

          </div>

          <div className="mt-2 text-sm text-gray-600">
            {workOrder.product.name}
          </div>

          <div className="mt-1 text-sm text-gray-500">
            {workOrder.product.code}
            {" · "}
            Količina: {workOrder.quantity}
          </div>

        </div>

        <div className="w-full lg:w-80">

          <div className="mb-2 flex items-center justify-between text-sm">

            <span className="font-medium text-gray-700">
              Napredak
            </span>

            <span className="text-gray-500">
              {completed} / {total}
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-200">

            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="mt-2 flex justify-between text-xs text-gray-500">

            <span>
              {progress}% završeno
            </span>

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
      "bg-gray-100 text-gray-600",

    COMPLETED:
      "bg-gray-100 text-gray-700",

    PLANNED:
      "bg-gray-100 text-gray-600",

    IN_PROGRESS:
      "bg-yellow-100 text-yellow-700",

    FREE:
      "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "bg-gray-100 text-gray-600"
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
    <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
      {text}
    </div>
  );
}