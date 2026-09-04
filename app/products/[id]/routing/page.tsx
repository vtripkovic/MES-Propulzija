"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Machine = {
  id: string;
  code: string;
  name: string;
  department?: {
    id: string;
    name: string;
  } | null;
};

type OperationMachine = {
  id: string;
  machine: Machine;
};

type Operation = {
  id: string;
  sequence: number;
  name: string;
  type: string;
  setupTime: number | null;
  cycleTime: number | null;
  machines: OperationMachine[];
};

type Product = {
  id: string;
  code: string;
  name: string;
  revision: string;
};

type Routing = {
  id: string;
  productId: string;
  revision: string;
  createdAt: string;
  updatedAt: string;
  operations: Operation[];
};

type RoutingResponse =
  | Routing
  | {
      routing: null;
      product: Product;
      message: string;
    };

function isRouting(
  data: RoutingResponse,
): data is Routing {
  return "operations" in data;
}

function formatTime(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value} min`;
}

export default function RoutingPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] =
    useState<RoutingResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [sequence, setSequence] =
    useState("");

  const [name, setName] =
    useState("");

  const [type, setType] =
    useState("");

  const [setupTime, setSetupTime] =
    useState("");

  const [cycleTime, setCycleTime] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRouting() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/products/${id}/routing`,
          {
            cache: "no-store",
          },
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "Greška pri učitavanju routinga",
          );
        }

        if (cancelled) {
          return;
        }

        setData(result);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Nepoznata greška",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRouting();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function refreshRouting() {
    const response = await fetch(
      `/api/products/${id}/routing`,
      {
        cache: "no-store",
      },
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ??
          "Greška pri osvežavanju routinga",
      );
    }

    setData(result);
  }

  function resetForm() {
    setSequence("");
    setName("");
    setType("");
    setSetupTime("");
    setCycleTime("");
  }

  async function addOperation() {
    const parsedSequence =
      Number(sequence);

    const parsedSetupTime =
      setupTime === ""
        ? null
        : Number(setupTime);

    const parsedCycleTime =
      cycleTime === ""
        ? null
        : Number(cycleTime);

    if (
      !Number.isInteger(parsedSequence) ||
      parsedSequence <= 0
    ) {
      setError(
        "Redni broj mora biti pozitivan ceo broj.",
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Naziv operacije je obavezan.",
      );
      return;
    }

    if (!type.trim()) {
      setError(
        "Tip operacije je obavezan.",
      );
      return;
    }

    if (
      parsedSetupTime !== null &&
      (!Number.isInteger(parsedSetupTime) ||
        parsedSetupTime < 0)
    ) {
      setError(
        "Setup vreme mora biti ceo broj veći ili jednak nuli.",
      );
      return;
    }

    if (
      parsedCycleTime !== null &&
      (!Number.isInteger(parsedCycleTime) ||
        parsedCycleTime < 0)
    ) {
      setError(
        "Cycle vreme mora biti ceo broj veći ili jednak nuli.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/products/${id}/routing/operations`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            sequence: parsedSequence,
            name: name.trim(),
            type: type.trim(),
            setupTime: parsedSetupTime,
            cycleTime: parsedCycleTime,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            `Greška pri dodavanju operacije (${response.status})`,
        );
      }

      resetForm();
      setShowAddForm(false);

      await refreshRouting();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri dodavanju operacije",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-700">
          Učitavanje routinga...
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/products/${id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Nazad na proizvod
          </Link>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  if (!isRouting(data)) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">

          <Link
            href={`/products/${id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Nazad na proizvod
          </Link>

          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {data.product.code}
                  </h1>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                    Rev. {data.product.revision}
                  </span>
                </div>

                <p className="mt-1 text-gray-700">
                  {data.product.name}
                </p>
              </div>

              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                Routing ne postoji
              </span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const routing = data;

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-6">
          <Link
            href={`/products/${id}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Nazad na proizvod
          </Link>
        </div>

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-bold text-gray-900">
                  Routing
                </h1>

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Rev. {routing.revision}
                </span>

              </div>

              <p className="mt-2 text-sm text-gray-700">
                ID proizvoda: {routing.productId}
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-gray-50 px-4 py-3 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {routing.operations.length}
                </div>

                <div className="text-xs text-gray-500">
                  operacija
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowAddForm(
                    (value) => !value,
                  );
                }}
                className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {showAddForm
                  ? "Zatvori"
                  : "+ Dodaj operaciju"}
              </button>

            </div>

          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ADD OPERATION */}

        {showAddForm && (
          <section className="mb-6 rounded-xl border border-blue-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Nova operacija
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Unesite osnovne podatke operacije.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

              {/* SEQUENCE */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Redni broj
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={sequence}
                  onChange={(event) =>
                    setSequence(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  placeholder="10"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* NAME */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Naziv
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  placeholder="Secenje"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* TYPE */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Tip
                </label>

                <input
                  type="text"
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  placeholder="CUTTING"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* SETUP */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Setup (min)
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={setupTime}
                  onChange={(event) =>
                    setSetupTime(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  placeholder="10"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* CYCLE */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Cycle (min)
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cycleTime}
                  onChange={(event) =>
                    setCycleTime(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  placeholder="5"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  resetForm();
                  setError("");
                  setShowAddForm(false);
                }}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Otkaži
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  void addOperation();
                }}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Čuvanje..."
                  : "Sačuvaj operaciju"}
              </button>

            </div>
          </section>
        )}

        {/* OPERATIONS */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Operacije
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Operacije su prikazane po redosledu izvršavanja.
            </p>
          </div>

          {routing.operations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400">
                Routing nema definisane operacije.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {routing.operations.map(
                (operation) => (
                  <div
                    key={operation.id}
                    className="px-6 py-5 hover:bg-gray-50"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      {/* OPERATION */}

                      <div className="flex min-w-0 flex-1 gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                          {operation.sequence}
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-semibold text-gray-900">
                              {operation.name}
                            </h3>

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                              {operation.type}
                            </span>

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">

                            <div>
                              <div className="text-xs text-gray-400">
                                Setup
                              </div>

                              <div className="font-medium text-gray-700">
                                {formatTime(
                                  operation.setupTime,
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-400">
                                Cycle
                              </div>

                              <div className="font-medium text-gray-700">
                                {formatTime(
                                  operation.cycleTime,
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-400">
                                Mašine
                              </div>

                              <div className="font-medium text-gray-700">
                                {operation.machines.length}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* MACHINES */}

                      <div className="lg:w-96">

                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                          Dodeljene mašine
                        </div>

                        {operation.machines.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                            Nema dodeljenih mašina
                          </div>
                        ) : (
                          <div className="space-y-2">

                            {operation.machines.map(
                              (operationMachine) => (
                                <div
                                  key={
                                    operationMachine.id
                                  }
                                  className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                                >

                                  <div className="font-medium text-gray-800">
                                    {
                                      operationMachine
                                        .machine
                                        .code
                                    }
                                  </div>

                                  <div className="text-sm text-gray-700">
                                    {
                                      operationMachine
                                        .machine
                                        .name
                                    }
                                  </div>

                                  {operationMachine
                                    .machine
                                    .department && (
                                    <div className="mt-1 text-xs text-gray-400">
                                      {
                                        operationMachine
                                          .machine
                                          .department
                                          .name
                                      }
                                    </div>
                                  )}

                                </div>
                              ),
                            )}

                          </div>
                        )}

                      </div>

                    </div>
                  </div>
                ),
              )}

            </div>
          )}
        </section>

      </div>
    </main>
  );
}