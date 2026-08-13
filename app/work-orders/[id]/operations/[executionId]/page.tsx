"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Machine = {
  id: string;
  name: string;
  code: string;
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
  machine: Machine | null;
  workOrder: {
    id: string;
    number: string;
    quantity: number;
    product: {
      name: string;
      code: string;
    };
  };
};

export default function OperationPage() {
  const params = useParams();

  const workOrderId = params.id as string;
  const executionId = params.executionId as string;

  const [execution, setExecution] =
    useState<OperationExecution | null>(null);

  const [availableMachines, setAvailableMachines] =
    useState<Machine[]>([]);

  const [selectedMachineId, setSelectedMachineId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/work-orders/${workOrderId}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Greška pri učitavanju radnog naloga",
          );
        }

        const workOrder = await response.json();

        const operation = workOrder.operations.find(
          (item: {
            id: string;
          }) => item.id === executionId,
        );

        if (!operation) {
          throw new Error("Operacija nije pronađena");
        }

        const machinesResponse = await fetch(
          `/api/operations/${operation.operation.id}/machines`,
          {
            cache: "no-store",
          },
        );

        if (!machinesResponse.ok) {
          throw new Error(
            "Greška pri učitavanju mašina",
          );
        }

        const machinesData =
          await machinesResponse.json();

        if (!cancelled) {
          setAvailableMachines(
            machinesData.value ?? machinesData,
          );

          setExecution({
            ...operation,
            workOrder: {
              id: workOrder.id,
              number: workOrder.number,
              quantity: workOrder.quantity,
              product: workOrder.product,
            },
          });

          if (
            operation.machine &&
            operation.status === "RUNNING"
          ) {
            setSelectedMachineId(
              operation.machine.id,
            );
          } else {
            setSelectedMachineId("");
          }
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

    void load();

    return () => {
      cancelled = true;
    };
  }, [executionId, workOrderId]);

  async function reloadOperation() {
    try {
      const response = await fetch(
        `/api/work-orders/${workOrderId}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Greška pri učitavanju radnog naloga",
        );
      }

      const workOrder = await response.json();

      const operation = workOrder.operations.find(
        (item: {
          id: string;
        }) => item.id === executionId,
      );

      if (!operation) {
        throw new Error("Operacija nije pronađena");
      }

      const machinesResponse = await fetch(
        `/api/operations/${operation.operation.id}/machines`,
        {
          cache: "no-store",
        },
      );

      if (!machinesResponse.ok) {
        throw new Error(
          "Greška pri učitavanju mašina",
        );
      }

      const machinesData =
        await machinesResponse.json();

      setAvailableMachines(
        machinesData.value ?? machinesData,
      );

      setExecution({
        ...operation,
        workOrder: {
          id: workOrder.id,
          number: workOrder.number,
          quantity: workOrder.quantity,
          product: workOrder.product,
        },
      });

      if (
        operation.machine &&
        operation.status === "RUNNING"
      ) {
        setSelectedMachineId(
          operation.machine.id,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri osvežavanju",
      );
    }
  }

  async function startOperation() {
    if (
      availableMachines.length > 0 &&
      !selectedMachineId
    ) {
      setError("Izaberi mašinu");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/work-orders/${workOrderId}/operations/${executionId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            selectedMachineId
              ? {
                  machineId: selectedMachineId,
                }
              : {},
          ),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(
          () => null,
        );

        throw new Error(
          data?.error ??
            "Operacija nije mogla da se pokrene",
        );
      }

      await reloadOperation();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri pokretanju",
      );
    } finally {
      setBusy(false);
    }
  }

  async function completeOperation() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/work-orders/${workOrderId}/operations/${executionId}/complete`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(
          () => null,
        );

        throw new Error(
          data?.error ??
            "Operacija nije mogla da se završi",
        );
      }

      await reloadOperation();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri završavanju",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Učitavanje...
      </main>
    );
  }

  if (error && !execution) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-100 p-6 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!execution) {
    return null;
  }

  console.log("MACHINE CHECK", {
    operation: execution.operation.name,
    operationId: execution.operation.id,
    status: execution.status,
    availableMachines,
    selectedMachineId,
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Radni nalog
          </p>

          <h1 className="text-3xl font-bold">
            {execution.workOrder.number}
          </h1>

          <p className="mt-1 text-gray-600">
            {execution.workOrder.product.name}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm text-gray-500">
              Operacija {execution.operation.sequence}
            </p>

            <h2 className="mt-1 text-3xl font-bold">
              {execution.operation.name}
            </h2>

            <p className="mt-2 text-gray-500">
              Tip: {execution.operation.type}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <Info
              label="Količina"
              value={String(
                execution.workOrder.quantity,
              )}
            />

            <Info
              label="Status"
              value={getStatusLabel(execution.status)}
            />

            <Info
              label="Mašina"
              value={
                execution.machine?.name ??
                "Nije izabrana"
              }
            />

            <Info
              label="Stvarno vreme"
              value={
                execution.actualTime !== null
                  ? `${execution.actualTime} min`
                  : "-"
              }
            />
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}

          {execution.status === "READY" &&
            availableMachines.length > 0 && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mašina
                </label>

                <select
                  value={selectedMachineId}
                  onChange={(event) =>
                    setSelectedMachineId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-4 text-lg"
                >
                  <option value="">
                    Izaberi mašinu
                  </option>

                  {availableMachines.map(
                    (machine) => (
                      <option
                        key={machine.id}
                        value={machine.id}
                      >
                        {machine.name} — {machine.code}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}

          {execution.status === "READY" && (
            <button
              onClick={startOperation}
              disabled={
                busy ||
                (availableMachines.length > 0 &&
                  !selectedMachineId)
              }
              className="w-full rounded-xl bg-blue-600 px-6 py-5 text-xl font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy
                ? "Pokretanje..."
                : "POKRENI OPERACIJU"}
            </button>
          )}

          {execution.status === "RUNNING" && (
            <button
              onClick={completeOperation}
              disabled={busy}
              className="w-full rounded-xl bg-green-600 px-6 py-5 text-xl font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {busy
                ? "Završavanje..."
                : "ZAVRŠI OPERACIJU"}
            </button>
          )}

          {execution.status === "COMPLETED" && (
            <div className="rounded-xl bg-green-100 p-6 text-center text-xl font-bold text-green-800">
              ✓ OPERACIJA JE ZAVRŠENA
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="text-sm text-gray-500">
        {label}
      </div>

      <div className="mt-1 font-semibold">
        {value}
      </div>
    </div>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PLANNED":
      return "PLANIRANO";
    case "WAITING":
      return "ČEKA";
    case "READY":
      return "SPREMNO";
    case "RUNNING":
      return "U TOKU";
    case "COMPLETED":
      return "ZAVRŠENO";
    default:
      return status;
  }
}