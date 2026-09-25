type MachineStatus =
  | "FREE"
  | "WAITING"
  | "READY"
  | "RUNNING";

type MachineStatusItem = {
  id: string;
  code: string;
  name: string;
  status: MachineStatus;
  workOrderNumber?: string;
  workOrderId?: string;
  operationName?: string;
};

type MachineStatusProps = {
  machines: MachineStatusItem[];
};

const statusLabels: Record<MachineStatus, string> = {
  FREE: "Slobodna",
  WAITING: "Čeka",
  READY: "Spremno",
  RUNNING: "U toku",
};

const statusClasses: Record<MachineStatus, string> = {
  FREE: "bg-green-100 text-green-700",
  WAITING: "bg-gray-100 text-gray-700",
  READY: "bg-blue-100 text-blue-700",
  RUNNING: "bg-yellow-100 text-yellow-700",
};

const statusDots: Record<MachineStatus, string> = {
  FREE: "bg-green-500",
  WAITING: "bg-gray-400",
  READY: "bg-blue-500",
  RUNNING: "bg-yellow-500",
};

export default function MachineStatus({
  machines,
}: MachineStatusProps) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Status mašina
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Trenutno stanje mašina i poslovi koji se na njima
          izvršavaju
        </p>
      </div>

      {machines.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            Ovaj sektor nema definisane mašine.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {machines.map((machine) => {
            const status = machine.status;

            return (
              <div
                key={machine.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900">
                      {machine.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {machine.code}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${statusDots[status]}`}
                    />

                    {statusLabels[status]}
                  </span>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  {machine.status === "FREE" ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Trenutni posao
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        Mašina trenutno nije angažovana.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Radni nalog
                        </p>

                        {machine.workOrderId ? (
                          <a
                            href={`/work-orders/${machine.workOrderId}`}
                            className="mt-1 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {machine.workOrderNumber}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500">
                            —
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Operacija
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {machine.operationName ?? "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}