import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { prisma } from "@/app/lib/prisma";
import MachineStatus from "./machine-status";

type SectorPageProps = {
  params: Promise<{
    code: string;
  }>;
};

const statusLabels: Record<string, string> = {
  WAITING: "Čeka",
  READY: "Spremno",
  RUNNING: "U toku",
  COMPLETED: "Završeno",
};

const statusClasses: Record<string, string> = {
  WAITING: "bg-gray-100 text-gray-700",
  READY: "bg-blue-100 text-blue-700",
  RUNNING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default async function SectorPage({
  params,
}: SectorPageProps) {
  const { code } = await params;

  const sector = await prisma.department.findUnique({
    where: {
      code,
    },
    include: {
      machines: {
        orderBy: {
          code: "asc",
        },
      },
    },
  });

  if (!sector) {
    notFound();
  }

  const workOrders = await prisma.workOrder.findMany({
    orderBy: {
      createdAt: "asc",
    },
    include: {
      product: true,
      operations: {
        orderBy: {
          operation: {
            sequence: "asc",
          },
        },
        include: {
          operation: {
            include: {
              machines: {
                include: {
                  machine: {
                    include: {
                      department: true,
                    },
                  },
                },
              },
            },
          },
          machine: {
            include: {
              department: true,
            },
          },
        },
      },
    },
  });

  /*
   * Pronalazimo trenutnu operaciju svakog radnog naloga.
   *
   * Trenutna operacija je prva operacija koja još nije
   * završena.
   */
  const currentJobs = workOrders
    .map((workOrder) => {
      const currentOperation = workOrder.operations.find(
        (execution) => execution.status !== "COMPLETED",
      );

      if (!currentOperation) {
        return null;
      }

      /*
       * Proveravamo da li trenutna operacija pripada
       * ovom sektoru.
       *
       * Postoje dva slučaja:
       *
       * 1. Mašina je već izabrana za izvršenje.
       * 2. Mašina još nije izabrana, ali je operacija
       *    povezana sa mašinama ovog sektora.
       */
      const belongsToSector =
        currentOperation.machine?.departmentId === sector.id ||
        currentOperation.operation.machines.some(
          (operationMachine) =>
            operationMachine.machine.departmentId === sector.id,
        );

      if (!belongsToSector) {
        return null;
      }

      const completedOperations =
        workOrder.operations.filter(
          (execution) => execution.status === "COMPLETED",
        ).length;

      return {
        workOrder,
        currentOperation,
        completedOperations,
        totalOperations: workOrder.operations.length,
      };
    })
    .filter(
      (
        job,
      ): job is NonNullable<typeof job> => job !== null,
    );

  /*
   * Pripremamo podatke za kartice mašina.
   *
   * Status mašine NE čuvamo posebno u bazi.
   * Izračunavamo ga iz OperationExecution podataka.
   */
  const machineStatuses = sector.machines.map((machine) => {
    const runningExecution =
      workOrders
        .flatMap((workOrder) => workOrder.operations)
        .find(
          (execution) =>
            execution.machineId === machine.id &&
            execution.status === "RUNNING",
        );

    const readyExecution =
      workOrders
        .flatMap((workOrder) => workOrder.operations)
        .find(
          (execution) =>
            execution.machineId === machine.id &&
            execution.status === "READY",
        );

    const waitingExecution =
      workOrders
        .flatMap((workOrder) => workOrder.operations)
        .find(
          (execution) =>
            execution.machineId === machine.id &&
            execution.status === "WAITING",
        );

    let status:
      | "FREE"
      | "WAITING"
      | "READY"
      | "RUNNING" = "FREE";

    let activeExecution = null;

    /*
     * Prioritet:
     *
     * RUNNING
     * READY
     * WAITING
     * FREE
     */
    if (runningExecution) {
      status = "RUNNING";
      activeExecution = runningExecution;
    } else if (readyExecution) {
      status = "READY";
      activeExecution = readyExecution;
    } else if (waitingExecution) {
      status = "WAITING";
      activeExecution = waitingExecution;
    }

    if (!activeExecution) {
      return {
        id: machine.id,
        code: machine.code,
        name: machine.name,
        status,
      };
    }

    const workOrder = workOrders.find(
      (order) =>
        order.operations.some(
          (execution) => execution.id === activeExecution?.id,
        ),
    );

    return {
      id: machine.id,
      code: machine.code,
      name: machine.name,
      status,
      workOrderNumber: workOrder?.number,
      workOrderId: workOrder?.id,
      operationName:
        activeExecution.operation.name,
    };
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
          <div className="mb-8">
            <div className="mb-2">
              <Link
                href="/sectors"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← Svi sektori
              </Link>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {sector.name}
                  </h1>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                    {sector.code}
                  </span>
                </div>

                <p className="mt-2 text-gray-700">
                  Pregled mašina i trenutnih poslova u sektoru
                </p>
              </div>

              <div className="flex gap-3">
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Mašine
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {sector.machines.length}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Trenutni poslovi
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {currentJobs.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS MAŠINA */}

          <MachineStatus
            machines={machineStatuses}
          />

          {/* TRENUTNI POSLOVI */}

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Trenutni poslovi
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Radni nalozi čija se trenutna faza nalazi u ovom
                sektoru
              </p>
            </div>

            {currentJobs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Nema trenutnih poslova
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Trenutno nema radnih naloga koji se nalaze u
                  ovom sektoru.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Radni nalog
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Proizvod
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Trenutna faza
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Mašina
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Napredak
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Akcija
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {currentJobs.map(
                        ({
                          workOrder,
                          currentOperation,
                          completedOperations,
                          totalOperations,
                        }) => {
                          const status =
                            currentOperation.status;

                          return (
                            <tr
                              key={currentOperation.id}
                              className="transition-colors hover:bg-gray-50"
                            >
                              <td className="px-6 py-4">
                                <Link
                                  href={`/work-orders/${workOrder.id}`}
                                  className="font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  {workOrder.number}
                                </Link>
                              </td>

                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {workOrder.product.name}
                                </div>

                                <div className="text-sm text-gray-500">
                                  {workOrder.product.code}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {
                                    currentOperation.operation
                                      .sequence
                                  }
                                  .{" "}
                                  {
                                    currentOperation.operation
                                      .name
                                  }
                                </div>

                                <div className="text-sm text-gray-500">
                                  {
                                    currentOperation.operation
                                      .type
                                  }
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                {currentOperation.machine ? (
                                  <>
                                    <div className="font-medium text-gray-900">
                                      {
                                        currentOperation.machine
                                          .name
                                      }
                                    </div>

                                    <div className="text-sm text-gray-500">
                                      {
                                        currentOperation.machine
                                          .code
                                      }
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500">
                                    Nije izabrana
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    statusClasses[status] ??
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {statusLabels[status] ??
                                    status}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {completedOperations} /{" "}
                                  {totalOperations}
                                </div>

                                <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{
                                      width: `${
                                        totalOperations > 0
                                          ? (completedOperations /
                                              totalOperations) *
                                            100
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <Link
                                  href={`/work-orders/${workOrder.id}`}
                                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  Otvori →
                                </Link>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}