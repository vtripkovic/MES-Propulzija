"use client";

import { useEffect, useState } from "react";

type Department = { id: string; code: string; name: string };
type UserRecord = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  approvedAt: string | null;
  isActive: boolean;
  departmentId: string | null;
  department: Department | null;
  createdAt: string;
};
type UserSettingsData = { users: UserRecord[]; departments: Department[] };
type UserDraft = {
  role: "ADMIN" | "USER";
  approved: boolean;
  isActive: boolean;
  departmentId: string;
};

export default function UsersSettings() {
  const [data, setData] = useState<UserSettingsData | null>(null);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  async function fetchData(): Promise<UserSettingsData> {
    const response = await fetch("/api/settings/users", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Učitavanje nije uspelo.");
    return result;
  }

  function applyData(result: UserSettingsData) {
    setData(result);
    setDrafts(Object.fromEntries(result.users.map((user) => [
      user.id,
      {
        role: user.role,
        approved: Boolean(user.approvedAt),
        isActive: user.isActive,
        departmentId: user.departmentId ?? "",
      },
    ])));
  }

  async function load() {
    try {
      applyData(await fetchData());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Učitavanje nije uspelo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchData()
      .then((result) => {
        if (!cancelled) applyData(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Učitavanje nije uspelo.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateDraft(userId: string, patch: Partial<UserDraft>) {
    setDrafts((current) => ({
      ...current,
      [userId]: { ...current[userId], ...patch },
    }));
  }

  async function save(userId: string) {
    const draft = drafts[userId];
    if (!draft) return;
    setSaving(userId);
    setError("");
    try {
      const response = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...draft,
          departmentId: draft.role === "ADMIN" ? null : draft.departmentId || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Izmena nije uspela.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Izmena nije uspela.");
    } finally {
      setSaving("");
    }
  }

  if (loading) return <p className="text-gray-600">Učitavanje korisnika...</p>;
  if (error && !data) return <p role="alert" className="text-red-700">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {data.users.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
          Nema registrovanih korisnika.
        </div>
      ) : data.users.map((user) => {
        const draft = drafts[user.id];
        if (!draft) return null;
        return (
          <section key={user.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Registrovan: {new Date(user.createdAt).toLocaleDateString("sr-RS")}
                </p>
              </div>
              <button
                type="button"
                disabled={saving === user.id}
                onClick={() => void save(user.id)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving === user.id ? "Čuvanje..." : "Sačuvaj"}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-gray-700">
                Uloga
                <select
                  value={draft.role}
                  onChange={(event) => updateDraft(user.id, {
                    role: event.target.value as UserDraft["role"],
                    departmentId: event.target.value === "ADMIN" ? "" : draft.departmentId,
                    approved: event.target.value === "ADMIN" ? true : draft.approved,
                  })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="USER">Korisnik</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Sektor
                <select
                  disabled={draft.role === "ADMIN"}
                  value={draft.departmentId}
                  onChange={(event) => updateDraft(user.id, { departmentId: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                >
                  <option value="">Izaberite sektor</option>
                  {data.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.code} — {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-sm text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={draft.role === "ADMIN"}
                    checked={draft.approved}
                    onChange={(event) => updateDraft(user.id, { approved: event.target.checked })}
                  />
                  Odobren
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) => updateDraft(user.id, { isActive: event.target.checked })}
                  />
                  Aktivan
                </label>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
