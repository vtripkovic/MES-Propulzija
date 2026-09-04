
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type BomNode = {
  id: string;
  quantity: number;
  child: {
    id: string;
    code: string;
    name: string;
    revision: string;
  };
  children: BomNode[];
};

type Product = {
  id: string;
  code: string;
  name: string;
  revision: string;
};

type ProductOption = Product;

type BomResponse = {
  product: Product;
  items: BomNode[];
};

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<BomResponse | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const loadBom = useCallback(async () => {
  const response = await fetch(
    `/api/products/${id}/bom`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Greška pri učitavanju proizvoda",
    );
  }

  const result: BomResponse =
    await response.json();

  setData(result);
}, [id]);

  const loadProducts = useCallback(async () => {
  const response = await fetch(
    "/api/products",
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Greška pri učitavanju proizvoda",
    );
  }

  const result = await response.json();

  setProducts(
    result.value ?? result,
  );
}, []);

  useEffect(() => {
  let cancelled = false;

  async function loadPage() {
    try {
      await Promise.all([
        loadBom(),
        loadProducts(),
      ]);

      if (!cancelled) {
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

  void loadPage();

  return () => {
    cancelled = true;
  };
}, [loadBom, loadProducts]);

  async function addComponent() {
    if (!selectedChildId) {
      setError("Izaberite komponentu.");
      return;
    }

    const numericQuantity = Number(quantity);

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError(
        "Količina mora biti veća od nule.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/products/${id}/bom`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            childId: selectedChildId,
            quantity: numericQuantity,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Greška pri dodavanju komponente",
        );
      }

      await loadBom();

      setSelectedChildId("");
      setQuantity("1");
      setShowAddForm(false);
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
    itemId: string,
    currentQuantity: number,
  ) {
    const value = window.prompt(
      "Nova količina:",
      String(currentQuantity),
    );

    if (value === null) {
      return;
    }

    const numericQuantity = Number(value);

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError(
        "Količina mora biti veća od nule.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/products/${id}/bom/${itemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            quantity: numericQuantity,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Greška pri izmeni količine",
        );
      }

      await loadBom();
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

  async function deleteItem(itemId: string) {
    const confirmed = window.confirm(
      "Da li ste sigurni da želite da obrišete ovu BOM stavku?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/products/${id}/bom/${itemId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Greška pri brisanju BOM stavke",
        );
      }

      await loadBom();
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600">
          Učitavanje...
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
        <div className="rounded-xl bg-red-100 p-6 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const availableProducts = products.filter(
    (product) =>
      product.id !== data.product.id,
  );

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-6">
          <Link
            href="/products"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Proizvodi
          </Link>
        </div>

        {/* PRODUCT HEADER */}

        <div className="mb-6 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Proizvod
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                {data.product.name}
              </h1>

              <p className="mt-2 text-gray-600">
                Šifra: {data.product.code}
              </p>
            </div>

            <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium">
              Revizija {data.product.revision}
            </div>
          </div>
        </div>

        {/* BOM */}

        <div className="rounded-2xl bg-white p-8 shadow-sm">

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                BOM Editor
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Struktura sklopa i komponenti proizvoda
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddForm(
                  (value) => !value,
                );
                setError("");
              }}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showAddForm
                ? "Otkaži"
                : "+ Dodaj komponentu"}
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-lg bg-red-100 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ADD FORM */}

          {showAddForm && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="text-lg font-semibold text-gray-900">
                Dodaj komponentu
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_160px_auto]">

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Komponenta
                  </label>

                  <select
                    value={selectedChildId}
                    onChange={(event) =>
                      setSelectedChildId(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Izaberite komponentu
                    </option>

                    {availableProducts.map(
                      (product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.code} —{" "}
                          {product.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Količina
                  </label>

                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      void addComponent();
                    }}
                    disabled={saving}
                    className="w-full rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Dodavanje..."
                      : "Dodaj"}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TREE */}

          <div className="rounded-xl border border-gray-200 p-5">

            {data.items.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                Proizvod nema definisanu BOM strukturu.
              </div>
            ) : (
              <div className="space-y-1">
                {data.items.map((item) => (
                  <BomTree
                    key={item.id}
                    node={item}
                    level={0}
                    onEdit={updateQuantity}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}

function BomTree({
  node,
  level,
  onEdit,
  onDelete,
}: {
  node: BomNode;
  level: number;
  onEdit: (
    itemId: string,
    quantity: number,
  ) => void;
  onDelete: (
    itemId: string,
  ) => void;
}) {
  const [expanded, setExpanded] =
    useState(true);

  const hasChildren =
    node.children.length > 0;

  return (
    <div>

      <div
        className="group flex items-center rounded-lg px-3 py-3 hover:bg-gray-50"
        style={{
          paddingLeft: `${level * 32 + 12}px`,
        }}
      >

        <button
          type="button"
          onClick={() => {
            if (hasChildren) {
              setExpanded(
                (value) => !value,
              );
            }
          }}
          className={`mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm ${
            hasChildren
              ? "cursor-pointer bg-gray-100 hover:bg-gray-200"
              : "cursor-default text-gray-300"
          }`}
        >
          {hasChildren
            ? expanded
              ? "▼"
              : "▶"
            : "•"}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">

            <span className="font-medium text-gray-900">
              {node.child.code}
            </span>

            <span className="text-gray-700">
              {node.child.name}
            </span>

            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
              Rev. {node.child.revision}
            </span>

          </div>
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-2">

          <span className="whitespace-nowrap text-sm font-medium text-gray-600">
            × {node.quantity}
          </span>

          <button
            type="button"
            onClick={() =>
              onEdit(
                node.id,
                node.quantity,
              )
            }
            className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            Izmeni
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(node.id)
            }
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Obriši
          </button>

        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map(
            (child) => (
              <BomTree
                key={child.id}
                node={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ),
          )}
        </div>
      )}

    </div>
  );
}

