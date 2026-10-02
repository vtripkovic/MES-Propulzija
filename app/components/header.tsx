"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type HeaderUser = {
  name: string;
  role: "ADMIN" | "USER";
  department: { code: string } | null;
};

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<HeaderUser>;
      })
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch(() => {
        if (!cancelled) setAuthError("Nije moguće proveriti status prijave.");
      })
      .finally(() => {
        if (!cancelled) setCheckedSession(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        setUser(null);
        router.push("/login");
        router.refresh();
      } else {
        setAuthError("Odjava nije uspela. Pokušajte ponovo.");
      }
    } catch {
      setAuthError("Odjava nije uspela. Proverite mrežnu vezu.");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-4 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
          {user?.role === "USER" ? (
            <span className="text-2xl font-bold text-blue-600">
              MES Propulzija
            </span>
          ) : (
            <Link href="/" className="text-2xl font-bold text-blue-600">
              MES Propulzija
            </Link>
          )}

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {user?.role === "USER" ? (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="cursor-pointer text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
                >
                  Odjava
                </button>
              </>
            ) : user?.role === "ADMIN" ? (
              <>
                <NavLink href="/products" label="Proizvodi" />
                <NavLink href="/production" label="Proizvodnja" />
                <NavLink href="/sectors" label="Sektori" />
                <NavLink href="/work-orders" label="Radni nalozi" />
                <details className="group relative">
                  <summary className="cursor-pointer list-none text-sm font-medium text-gray-700 transition-colors hover:text-blue-600">
                    Podešavanja
                    <span aria-hidden="true" className="ml-1">▾</span>
                  </summary>
                  <div className="absolute right-0 z-50 mt-2 min-w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                    <NavLink
                      href="/machines"
                      label="Mašine"
                      block
                    />
                    <NavLink
                      href="/settings/users"
                      label="Podešavanje korisnika"
                      block
                    />
                  </div>
                </details>
                <span className="text-sm text-gray-600">
                  {user.name} (admin)
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="cursor-pointer text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
                >
                  Odjava
                </button>
              </>
            ) : !user && checkedSession ? (
              <>
                <NavLink href="/login" label="Prijava" />
                <NavLink href="/register" label="Registracija" />
              </>
            ) : null}
          </nav>
          {authError && (
            <p role="alert" className="text-xs text-red-700">{authError}</p>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  block = false,
}: {
  href: string;
  label: string;
  block?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${block ? "block rounded-md px-3 py-2 hover:bg-gray-100" : ""} text-sm font-medium text-gray-700 transition-colors hover:text-blue-600`}
    >
      {label}
    </Link>
  );
}
