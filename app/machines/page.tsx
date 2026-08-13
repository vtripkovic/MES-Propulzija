"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600">
          Učitavanje mašina...
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

  return (
    <main className="min-h-screen bg-gray-100 p-8">      
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Nazad na početnu
          </Link>
        </div>
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Proizvodnja
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Mašine
          </h1>

          <p className="mt-2 text-gray-600">
            Pregled mašina po proizvodnim odeljenjima
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {machines.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">
              Nema evidentiranih mašina.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {departments.map(
              ({ department, machines: departmentMachines }) => (
                <section
                  key={department.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        {department.code}
                      </div>

                      <h2 className="mt-1 text-xl font-bold text-gray-900">
                        {department.name}
                      </h2>
                    </div>

                    <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                      {departmentMachines.length}{" "}
                      {departmentMachines.length === 1
                        ? "mašina"
                        : "mašina"}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {departmentMachines.map((machine) => (
                      <MachineCard
                        key={machine.id}
                        machine={machine}
                      />
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function MachineCard({
  machine,
}: {
  machine: Machine;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 transition hover:border-gray-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {machine.code}
          </div>

          <h3 className="mt-1 text-lg font-semibold text-gray-900">
            {machine.name}
          </h3>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          ⚙
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="text-sm text-gray-500">
          Odeljenje
        </div>

        <div className="mt-1 font-medium text-gray-800">
          {machine.department.name}
        </div>
      </div>
    </div>
  );
}