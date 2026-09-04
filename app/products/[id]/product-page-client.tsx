"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { ErrorAlert } from "@/app/components/alerts";
import { BomTree } from "./bom-tree";
import type {
  BomResponse,
  Machine,
  RoutingOperation,
} from "./product-types";

const reasonLabels = {
  self: "Sam proizvod ne može biti komponenta",
  "already-exists": "Komponenta već postoji u BOM-u",
  cycle: "Dodavanje bi napravilo cikličnu BOM strukturu",
} as const;

type AddComponentSectionProps = {
  saving: boolean;
  showAddForm: boolean;
  selectedChildId: string;
  quantity: string;
  canAdd: boolean;
  availableProducts: BomResponse["availableProducts"];
  onToggleForm: () => void;
  onSelectProduct: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onAddComponent: () => void;
  onClearError: () => void;
};

type RoutingSectionProps = {
  id: string;
  routingLoading: boolean;
  routingOperations: RoutingOperation[];
  operationMachines: Record<string, Machine[]>;
  saving: boolean;
  onRemoveMachine: (operationId: string, machineId: string) => void;
  onOpenMachineDialog: (operationId: string) => void;
};

type MachineAssignmentDialogProps = {
  saving: boolean;
  machinesLoading: boolean;
  machineDialogOperationId: string | null;
  availableMachinesForDialog: Machine[];
  onClose: () => void;
  onAssignMachine: (operationId: string, machineId: string) => void;
};

function AddComponentSection({
  saving,
  showAddForm,
  selectedChildId,
  quantity,
  canAdd,
  availableProducts,
  onToggleForm,
  onSelectProduct,
  onQuantityChange,
  onAddComponent,
  onClearError,
}: AddComponentSectionProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = availableProducts.find(
    (product) => product.id === selectedChildId,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section className="mb-6 overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Dodaj komponentu
            </h2>

            <p className="mt-1 text-sm text-gray-700">
              Dodajte nove komponente u BOM strukturu proizvoda
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleForm}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showAddForm ? "Otkaži" : "+ Dodaj komponentu"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Komponenta
              </label>

              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setDropdownOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <span
                    className={
                      selectedProduct ? "text-gray-900" : "text-gray-500"
                    }
                  >
                    {selectedProduct
                      ? `${selectedProduct.code} — ${selectedProduct.name}`
                      : "Izaberite komponentu..."}
                  </span>

                  <span className="ml-3 shrink-0 text-gray-500">
                    {dropdownOpen ? "▲" : "▼"}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 max-h-[500px] w-full overflow-y-auto rounded-lg border border-gray-300 bg-white py-1 shadow-lg">
                    {availableProducts.map((product) => {
                      const disabled = !product.allowed;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            onSelectProduct(product.id);
                            onClearError();
                            setDropdownOpen(false);
                          }}
                          className={`block w-full px-3 py-2.5 text-left text-sm transition-colors ${
                            disabled
                              ? "cursor-not-allowed bg-gray-50 text-gray-400"
                              : "text-gray-900 hover:bg-blue-50"
                          }`}
                        >
                          {product.code} — {product.name}

                          {disabled
                            ? ` — ${
                                product.reason
                                  ? reasonLabels[product.reason]
                                  : "nije dozvoljeno"
                              }`
                            : ""}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Količina
              </label>

              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(event) => onQuantityChange(event.target.value)}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled={!canAdd}
                onClick={onAddComponent}
                className="w-full rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
              >
                {saving ? "Dodavanje..." : "Dodaj"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <p className="font-medium">ℹ️ Informacija</p>

            <p className="mt-1">
              Nedozvoljene komponente su automatski onemogućene, a API dodatno
              proverava cikluse.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function RoutingSection({
  id,
  routingLoading,
  routingOperations,
  operationMachines,
  saving,
  onRemoveMachine,
  onOpenMachineDialog,
}: RoutingSectionProps) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Routing operacije
            </h2>

            <p className="mt-1 text-sm text-gray-700">
              Redosled i karakteristike proizvodnje
            </p>
          </div>

          <Link
            href={`/products/${id}/routing`}
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 md:w-auto"
          >
            + Dodaj operaciju
          </Link>
        </div>
      </div>

      {routingLoading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-500">
          ⏳ Učitavanje operacija...
        </div>
      ) : routingOperations.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mb-3 text-4xl">📋</div>

          <p className="text-lg font-medium text-gray-700">
            Nema definisanih operacija
          </p>

          <p className="mt-1 text-gray-500">
            Dodajte prvu operaciju proizvoda
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {routingOperations.map((operation) => (
            <div
              key={operation.id}
              className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-700">
                    {operation.sequence}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {operation.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Tip:{" "}
                      <span className="font-medium">{operation.type}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {operation.setupTime !== null && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      ⏱️ Setup: {operation.setupTime} min
                    </span>
                  )}

                  {operation.cycleTime !== null && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      ⏱️ Ciklus: {operation.cycleTime} min
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <span className="text-xs font-medium text-gray-700">
                  Dodeljene mašine:
                </span>

                <div className="flex flex-wrap gap-2">
                  {(operationMachines[operation.id] ?? []).length === 0 ? (
                    <span className="text-xs text-gray-500">
                      Nema dodeljenih mašina
                    </span>
                  ) : (
                    (operationMachines[operation.id] ?? []).map((machine) => (
                      <span
                        key={machine.id}
                        className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700"
                      >
                        ✓ {machine.name}

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            onRemoveMachine(operation.id, machine.id);
                          }}
                          className="font-bold text-green-700 transition-colors hover:text-red-600"
                          title="Ukloni mašinu"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      onOpenMachineDialog(operation.id);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    + Dodaj mašinu
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MachineAssignmentDialog({
  saving,
  machinesLoading,
  machineDialogOperationId,
  availableMachinesForDialog,
  onClose,
  onAssignMachine,
}: MachineAssignmentDialogProps) {
  if (!machineDialogOperationId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">
            Dodeli mašinu operaciji
          </h3>

          <p className="mt-1 text-sm text-gray-700">
            Izaberite mašinu koju ova operacija može da koristi
          </p>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto p-4">
          {machinesLoading ? (
            <div className="py-6 text-center text-sm text-gray-500">
              ⏳ Učitavanje mašina...
            </div>
          ) : availableMachinesForDialog.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              <p className="mb-2 text-2xl">✓</p>
              Sve dostupne mašine su već dodeljene
            </div>
          ) : (
            availableMachinesForDialog.map((machine) => (
              <button
                key={machine.id}
                type="button"
                disabled={saving}
                onClick={() => {
                  onAssignMachine(machineDialogOperationId, machine.id);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-green-300 hover:bg-green-50 disabled:opacity-50"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {machine.name}
                  </div>

                  <div className="mt-1 text-xs text-gray-700">
                    <span className="font-mono">{machine.code}</span> ·{" "}
                    {machine.department.name}
                  </div>
                </div>

                <span className="text-lg font-bold text-green-600">+</span>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            Otkaži
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductPageClient() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<BomResponse | null>(null);
  const [routingOperations, setRoutingOperations] = useState<
    RoutingOperation[]
  >([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operationMachines, setOperationMachines] = useState<
    Record<string, Machine[]>
  >({});
  const [machineDialogOperationId, setMachineDialogOperationId] = useState<
    string | null
  >(null);
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/products/${id}/bom`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const result = await response.json();

          throw new Error(
            result.error ?? "Greška pri učitavanju BOM strukture",
          );
        }

        const result: BomResponse = await response.json();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Nepoznata greška");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

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

        const result: Machine[] = await response.json();

        if (!cancelled) {
          setMachines(result);
        }
      } catch (err) {
        console.error("Greška pri učitavanju mašina:", err);
      }
    }

    void loadMachines();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOperationMachines() {
      if (routingOperations.length === 0) {
        setOperationMachines({});
        return;
      }

      try {
        setMachinesLoading(true);

        const entries = await Promise.all(
          routingOperations.map(async (operation) => {
            const response = await fetch(
              `/api/operations/${operation.id}/machines`,
              {
                cache: "no-store",
              },
            );

            if (!response.ok) {
              throw new Error(
                `Greška pri učitavanju mašina za operaciju ${operation.sequence}`,
              );
            }

            const result: Machine[] = await response.json();

            return [operation.id, result] as const;
          }),
        );

        if (!cancelled) {
          setOperationMachines(Object.fromEntries(entries));
        }
      } catch (err) {
        console.error("Greška pri učitavanju mašina operacija:", err);
      } finally {
        if (!cancelled) {
          setMachinesLoading(false);
        }
      }
    }

    void loadOperationMachines();

    return () => {
      cancelled = true;
    };
  }, [routingOperations]);

  useEffect(() => {
    let cancelled = false;

    async function loadRouting() {
      try {
        setRoutingLoading(true);

        const response = await fetch(
          `/api/products/${id}/routing/operations`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Greška pri učitavanju routinga");
        }

        const result: RoutingOperation[] = await response.json();

        if (!cancelled) {
          setRoutingOperations(result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Greška pri učitavanju routinga:", err);
          setRoutingOperations([]);
        }
      } finally {
        if (!cancelled) {
          setRoutingLoading(false);
        }
      }
    }

    void loadRouting();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function refreshBom() {
    const response = await fetch(`/api/products/${id}/bom`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const result = await response.json();

      throw new Error(
        result.error ?? "Greška pri osvežavanju BOM strukture",
      );
    }

    const result: BomResponse = await response.json();

    setData(result);
  }

  async function addComponent() {
    if (!selectedChildId) {
      setError("Izaberite komponentu.");
      return;
    }

    const selectedProduct = data?.availableProducts.find(
      (product) => product.id === selectedChildId,
    );

    if (!selectedProduct) {
      setError("Izabrana komponenta nije pronađena.");
      return;
    }

    if (!selectedProduct.allowed) {
      setError(
        selectedProduct.reason
          ? reasonLabels[selectedProduct.reason]
          : "Izabrana komponenta nije dozvoljena.",
      );

      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Količina mora biti veća od nule.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/products/${id}/bom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: selectedChildId,
          quantity: parsedQuantity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            `Greška pri dodavanju komponente (${response.status})`,
        );
      }

      setSelectedChildId("");
      setQuantity("1");
      setShowAddForm(false);

      await refreshBom();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri dodavanju komponente",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateQuantity(
    parentId: string,
    itemId: string,
    newQuantity: number,
  ) {
    if (!Number.isFinite(newQuantity) || newQuantity <= 0) {
      setError("Količina mora biti veća od nule.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/products/${parentId}/bom/${itemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: newQuantity,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Greška pri izmeni količine");
      }

      await refreshBom();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri izmeni količine",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(
    parentId: string,
    itemId: string,
    componentName: string,
  ) {
    const confirmed = window.confirm(
      `Da li želite da obrišete komponentu "${componentName}" iz BOM-a?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/products/${parentId}/bom/${itemId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Greška pri brisanju BOM stavke",
        );
      }

      await refreshBom();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri brisanju BOM stavke",
      );
    } finally {
      setSaving(false);
    }
  }

  async function assignMachine(
    operationId: string,
    machineId: string,
  ) {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/operations/${operationId}/machines`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ machineId }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Greška pri dodeljivanju mašine",
        );
      }

      setOperationMachines((current) => ({
        ...current,
        [operationId]: [
          ...(current[operationId] ?? []),
          result.machine,
        ],
      }));

      setMachineDialogOperationId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri dodeljivanju mašine",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeMachine(
    operationId: string,
    machineId: string,
  ) {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/operations/${operationId}/machines`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ machineId }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Greška pri uklanjanju mašine",
        );
      }

      setOperationMachines((current) => ({
        ...current,
        [operationId]: (current[operationId] ?? []).filter(
          (machine) => machine.id !== machineId,
        ),
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri uklanjanju mašine",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />

        <main className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="text-gray-700">
            Učitavanje BOM editora...
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />

        <main className="flex flex-1 items-center justify-center px-6 py-8">
          <ErrorAlert
            message={error || "Proizvod nije moguće učitati."}
          />
        </main>

        <Footer />
      </div>
    );
  }

  const selectedProduct = data.availableProducts.find(
    (product) => product.id === selectedChildId,
  );

  const parsedQuantity = Number(quantity);

  const canAdd =
    Boolean(selectedProduct?.allowed) &&
    Number.isFinite(parsedQuantity) &&
    parsedQuantity > 0 &&
    !saving;

  const availableMachinesForDialog = machineDialogOperationId
    ? machines.filter(
        (machine) =>
          !(operationMachines[machineDialogOperationId] ?? []).some(
            (assigned) => assigned.id === machine.id,
          ),
      )
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Link
              href="/products"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Nazad na proizvode
            </Link>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {data.product.code}
                  </h1>

                  <p className="mt-2 text-lg text-gray-700">
                    {data.product.name}
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
                  Rev. {data.product.revision}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorAlert
                message={error}
                onDismiss={() => setError("")}
              />
            </div>
          )}

          <AddComponentSection
            saving={saving}
            showAddForm={showAddForm}
            selectedChildId={selectedChildId}
            quantity={quantity}
            canAdd={canAdd}
            availableProducts={data.availableProducts}
            onToggleForm={() => {
              setShowAddForm((value) => !value);
              setError("");
            }}
            onSelectProduct={(value) => setSelectedChildId(value)}
            onQuantityChange={(value) => setQuantity(value)}
            onAddComponent={() => {
              void addComponent();
            }}
            onClearError={() => setError("")}
          />

          <RoutingSection
            id={id}
            routingLoading={routingLoading}
            routingOperations={routingOperations}
            operationMachines={operationMachines}
            saving={saving}
            onRemoveMachine={(operationId, machineId) => {
              void removeMachine(operationId, machineId);
            }}
            onOpenMachineDialog={(operationId) => {
              setMachineDialogOperationId(operationId);
            }}
          />

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                BOM struktura
              </h2>

              <p className="mt-1 text-sm text-gray-700">
                Komponente i potkompleti proizvoda
              </p>
            </div>

            {data.items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mb-3 text-4xl">📋</div>

                <p className="text-lg font-medium text-gray-700">
                  BOM je prazan
                </p>

                <p className="mt-1 text-gray-500">
                  Dodajte prvu komponentu pomoću dugmeta iznad
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.items.map((item) => (
                  <BomTree
                    key={item.id}
                    node={item}
                    parentId={data.product.id}
                    level={0}
                    saving={saving}
                    onUpdateQuantity={updateQuantity}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </section>

          <MachineAssignmentDialog
            saving={saving}
            machinesLoading={machinesLoading}
            machineDialogOperationId={machineDialogOperationId}
            availableMachinesForDialog={availableMachinesForDialog}
            onClose={() => setMachineDialogOperationId(null)}
            onAssignMachine={(operationId, machineId) => {
              void assignMachine(operationId, machineId);
            }}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}