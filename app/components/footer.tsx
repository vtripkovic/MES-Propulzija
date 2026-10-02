"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FooterUser = {
  role: "ADMIN" | "USER";
};

export default function Footer() {
  const year = new Date().getFullYear();
  const [user, setUser] = useState<FooterUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) {
          throw new Error("Status prijave nije moguće proveriti.");
        }
        return response.json() as Promise<FooterUser>;
      })
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch(() => {
        if (!cancelled) setSessionError(true);
      })
      .finally(() => {
        if (!cancelled) setSessionChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              MES Propulzija
            </p>
            <p className="mt-1 text-xs text-gray-700">
              Sistem za upravljanje proizvodnjom
            </p>
          </div>

          {sessionChecked && !sessionError && (!user || user.role === "ADMIN") && (
            <nav className="flex flex-wrap gap-6">
              <Link
                href="/products"
                className="text-xs text-gray-700 hover:text-gray-900"
              >
                Proizvodi
              </Link>
              <Link
                href="/machines"
                className="text-xs text-gray-700 hover:text-gray-900"
              >
                Mašine
              </Link>
              <Link
                href="/production"
                className="text-xs text-gray-700 hover:text-gray-900"
              >
                Proizvodnja
              </Link>
            </nav>
          )}

          {sessionError && (
            <p role="alert" className="text-xs text-red-700">
              Status prijave nije moguće proveriti.
            </p>
          )}

          <p className="text-xs text-gray-500">
            © {year} Propulzija. Sva prava zadržana.
          </p>
        </div>
      </div>
    </footer>
  );
}
