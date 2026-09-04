"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { LoadingSkeleton } from "@/app/components/loading";
import { ErrorAlert } from "@/app/components/alerts";

type Department = {
  id: string;
  code: string;
  name: string;
};

type Machine = {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  department: Department;
};

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMachines() {
      try {
        const response = await fetch("/api/machines", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Greška pri učitavanju mašina");
        }

        const data = await response.json();

        if (!cancelled) {
          setMachines(data.value ?? data);
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

    void loadMachines();

    return () => {
      cancelled = true;
    };
  }, []);

  const departments = useMemo(() => {
    const grouped = new Map<
      string,
      {
        department: Department;
        machines: Machine[];
      }
    >();

    for (const machine of machines) {
      const existing = grouped.get(machine.departmentId);

      if (existing) {
        existing.machines.push(machine);
      } else {
        grouped.set(machine.departmentId, {
          department: machine.department,
          machines: [machine],
        });
      }
    }

    return Array.from(grouped.values());
  }, [machines]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
              Proizvodnja
            </p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Mašine
            </h1>
            <p className="mt-2 text-lg text-gray-700">
              Upravljanje mašinama po proizvodnim odeljenjima
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorAlert
                message={error}
                onDismiss={() => setError("")}
              />
            </div>
          )}

          {loading ? (
            <LoadingSkeleton count={8} />
          ) : machines.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <div className="text-5xl mb-4">⚙️</div>
              <p className="text-lg text-gray-700 font-medium">
                Nema evidentiranih mašina
              </p>
              <p className="mt-1 text-gray-500">
                Počnite sa registrovanjem mašina
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {departments.map(
                ({ department, machines: departmentMachines }) => (
                  <section
                    key={department.id}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                            {department.code}
                          </p>
                          <h2 className="mt-1 text-2xl font-bold text-gray-900">
                            {department.name}
                          </h2>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">
                          🏭
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4 text-sm text-gray-500">
                        {departmentMachines.length}{" "}
                        {departmentMachines.length === 1
                          ? "mašina"
                          : "mašina"}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {departmentMachines.map((machine) => (
                          <MachineCard
                            key={machine.id}
                            machine={machine}
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                ),
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MachineCard({
  machine,
}: {
  machine: Machine;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg">
            ⚙️
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {machine.code}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900">
          {machine.name}
        </h3>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-700">
          <span>📍</span>
          {machine.department.name}
        </div>
      </div>
    </div>
  );
}
