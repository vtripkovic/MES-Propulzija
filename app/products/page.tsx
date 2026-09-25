"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { LoadingSkeleton } from "@/app/components/loading";
import { ErrorAlert } from "@/app/components/alerts";

type Product = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  revision: string;
};

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [revision, setRevision] = useState("A");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Greška pri učitavanju proizvoda");
        }

        const data = await response.json();

        if (!cancelled) {
          setProducts(data.value ?? data);
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

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreateForm() {
    setError("");
    setCode("");
    setName("");
    setDescription("");
    setRevision("A");
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (creating) {
      return;
    }

    setShowCreateForm(false);
    setError("");
  }

  async function createProduct() {
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedRevision = revision.trim();

    if (!trimmedCode) {
      setError("Šifra proizvoda je obavezna.");
      return;
    }

    if (!trimmedName) {
      setError("Naziv proizvoda je obavezan.");
      return;
    }

    if (!trimmedRevision) {
      setError("Revizija je obavezna.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: trimmedCode,
          name: trimmedName,
          description: trimmedDescription,
          revision: trimmedRevision,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Greška pri kreiranju proizvoda",
        );
      }

      setShowCreateForm(false);

      router.push(`/products/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Greška pri kreiranju proizvoda",
      );
    } finally {
      setCreating(false);
    }
  }

  async function deleteProduct() {
  if (!productToDelete) {
    return;
  }

  try {
    setDeleting(true);
    setError("");

    const response = await fetch(
      `/api/products/${productToDelete.id}`,
      {
        method: "DELETE",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ?? "Greška pri brisanju proizvoda",
      );
    }

    setProducts((currentProducts) =>
      currentProducts.filter(
        (product) =>
          product.id !== productToDelete.id,
      ),
    );

    setProductToDelete(null);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Greška pri brisanju proizvoda",
    );

    setProductToDelete(null);
  } finally {
    setDeleting(false);
  }
}

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Proizvodi
                </h1>

                <p className="mt-2 text-lg text-gray-700">
                  Upravljanje proizvodima, sklopovima i komponentama
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                + Novi proizvod
              </button>
            </div>
          </div>

          {/* Error */}
          {error && !showCreateForm && (
            <div className="mb-6">
              <ErrorAlert
                message={error}
                onDismiss={() => setError("")}
              />
            </div>
          )}

          {/* Products */}
          {loading ? (
            <LoadingSkeleton count={6} />
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <div className="mb-4 text-5xl">📦</div>

              <p className="text-lg font-medium text-gray-700">
                Nema registrovanih proizvoda
              </p>

              <p className="mt-1 text-gray-500">
                Počnite sa dodavanjem prvog proizvoda
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                + Dodaj prvi proizvod
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Šifra
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Naziv proizvoda
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Opis
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Revizija
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Akcija
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="transition-colors hover:bg-blue-50/40"
                      >
                        {/* Šifra */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {product.code}
                          </span>
                        </td>

                        {/* Naziv */}
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                        </td>

                        {/* Opis */}
                        <td className="max-w-md px-6 py-4">
                          {product.description ? (
                            <p className="line-clamp-2 text-sm text-gray-700">
                              {product.description}
                            </p>
                          ) : (
                            <span className="text-sm text-gray-400">
                              —
                            </span>
                          )}
                        </td>

                        {/* Revizija */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            Rev. {product.revision}
                          </span>
                        </td>

                        {/* Akcija */}
                        <td className="px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-2">
    <Link
      href={`/products/${product.id}`}
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
    >
      Detaljno
      <span className="ml-2">→</span>
    </Link>

    <button
      type="button"
      onClick={() => setProductToDelete(product)}
      className="inline-flex items-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
    >
      Obriši
    </button>
  </div>
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer table */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
                <p className="text-sm text-gray-600">
                  Ukupno proizvoda:{" "}
                  <span className="font-semibold text-gray-900">
                    {products.length}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Create Product Modal */}
      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateForm();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Novi proizvod
                  </h2>

                  <p className="mt-1 text-sm text-gray-700">
                    Unesite osnovne podatke o proizvodu
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={creating}
                  className="rounded-lg p-1 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50"
                  title="Zatvori"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-6">
              {error && (
                <ErrorAlert
                  message={error}
                  onDismiss={() => setError("")}
                />
              )}

              {/* Code */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Šifra proizvoda *
                </label>

                <input
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                  disabled={creating}
                  placeholder="npr. PROP-001"
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Naziv proizvoda *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  disabled={creating}
                  placeholder="npr. Propeler komplet"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Opis
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  disabled={creating}
                  rows={3}
                  placeholder="Opciono unesite opis proizvoda..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Revision */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Revizija *
                </label>

                <input
                  type="text"
                  value={revision}
                  onChange={(event) =>
                    setRevision(event.target.value)
                  }
                  disabled={creating}
                  placeholder="A"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closeCreateForm}
                disabled={creating}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Otkaži
              </button>

              <button
                type="button"
                onClick={() => {
                  void createProduct();
                }}
                disabled={
                  creating ||
                  !code.trim() ||
                  !name.trim() ||
                  !revision.trim()
                }
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Kreiranje..."
                  : "Kreiraj proizvod"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Product Confirmation Modal */}
{productToDelete && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setProductToDelete(null);
      }
    }}
  >
    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
      {/* Modal Header */}
      <div className="border-b border-gray-200 bg-red-50 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Obriši proizvod?
            </h2>

            <p className="mt-1 text-sm text-gray-700">
              Ova radnja se ne može poništiti.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setProductToDelete(null)}
            className="rounded-lg p-1 text-gray-500 hover:bg-white hover:text-gray-700"
            title="Zatvori"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="space-y-3 p-6">
        <p className="text-sm text-gray-700">
          Da li ste sigurni da želite da obrišete sledeći proizvod?
        </p>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            {productToDelete.code}
          </p>

          <p className="mt-1 text-sm text-gray-700">
            {productToDelete.name}
          </p>
        </div>

        <p className="text-sm text-gray-600">
          Brisanjem proizvoda biće uklonjene i njegove BOM i
          routing veze.
        </p>
      </div>

      {/* Modal Footer */}
      <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
        <button
  type="button"
  onClick={() => setProductToDelete(null)}
  disabled={deleting}
  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
>
  Otkaži
</button>

        <button
  type="button"
  onClick={() => {
    void deleteProduct();
  }}
  disabled={deleting}
  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {deleting
    ? "Brisanje..."
    : "Obriši proizvod"}
</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}