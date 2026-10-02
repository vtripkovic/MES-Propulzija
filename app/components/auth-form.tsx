"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type AuthMode = "login" | "register" | "bootstrap";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [bootstrapAvailable, setBootstrapAvailable] = useState(mode !== "bootstrap");

  useEffect(() => {
    if (mode !== "bootstrap") return;
    fetch("/api/auth/bootstrap", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Provera početnog podešavanja nije uspela.");
        const data = await response.json();
        setBootstrapAvailable(Boolean(data.available));
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Greška pri proveri podešavanja.");
      });
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, secret }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Zahtev nije uspeo.");
      if (mode === "login") {
        router.push(data.redirectTo ?? "/");
        router.refresh();
      } else if (mode === "bootstrap") {
        setMessage(data.message);
        setBootstrapAvailable(false);
      } else {
        setMessage(data.message);
        setPassword("");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Zahtev nije uspeo.");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "login"
      ? "Prijava"
      : mode === "register"
        ? "Registracija"
        : "Početno podešavanje administratora";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-12">
      <section className="w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {mode === "register" && (
          <p className="mt-2 text-sm text-gray-600">
            Nalog postaje dostupan nakon što administrator odobri registraciju i dodeli sektor.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}
        {bootstrapAvailable && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode !== "login" && (
              <label className="block text-sm font-medium text-gray-700">
                Ime i prezime
                <input
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            )}
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Lozinka
              <input
                required
                type="password"
                minLength={10}
                maxLength={256}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            {mode === "bootstrap" && (
              <label className="block text-sm font-medium text-gray-700">
                Početna tajna
                <input
                  required
                  type="password"
                  autoComplete="off"
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            )}
            <button
              disabled={busy}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Sačekajte..." : title}
            </button>
          </form>
        )}
        {mode === "bootstrap" && !bootstrapAvailable && !error && !message && (
          <p className="mt-4 text-sm text-gray-600">
            Početno podešavanje nije dostupno ili je već iskorišćeno.
          </p>
        )}
        {mode !== "bootstrap" && (
          <p className="mt-5 text-sm text-gray-600">
            {mode === "login" ? (
              <>Nemate nalog? <Link href="/register" className="font-medium text-blue-600 hover:underline">Registrujte se</Link></>
            ) : (
              <>Već imate nalog? <Link href="/login" className="font-medium text-blue-600 hover:underline">Prijavite se</Link></>
            )}
          </p>
        )}
        {mode === "login" && (
          <p className="mt-3 text-xs text-gray-500">
            Prvo podešavanje administratora: <Link href="/setup" className="text-blue-600 hover:underline">otvori početno podešavanje</Link>
          </p>
        )}
      </section>
    </main>
  );
}
