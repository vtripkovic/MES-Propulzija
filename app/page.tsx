"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            MES Propulzija
          </h1>

          <p className="mt-2 text-gray-600">
            Manufacturing Execution System
          </p>
        </div>

        {/* Main navigation */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            href="/work-orders/[id]"
            title="Radni nalozi"
            description="Pregled i upravljanje radnim nalozima i operacijama."
            icon="📋"
          />

          <DashboardCard
            href="/products"
            title="Proizvodi"
            description="Proizvodi, sklopovi, podsklopovi i BOM struktura."
            icon="📦"
          />

          <DashboardCard
            href="/machines"
            title="Mašine"
            description="Pregled proizvodnih mašina i njihovih operacija."
            icon="⚙️"
          />

          <DashboardCard
            href="/products/cmsmv7u6q0006y0r1pdp634lt"
            title="BOM"
            description="Pregled strukture proizvoda i svih komponenti."
            icon="🌳"
          />
        </div>

        {/* Production overview */}
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Proizvodnja
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Brzi pregled proizvodnog sistema
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Radni nalozi"
              value="1"
              description="trenutno u sistemu"
            />

            <StatCard
              label="Proizvodi"
              value="8"
              description="registrovanih proizvoda"
            />

            <StatCard
              label="Mašine"
              value="5"
              description="registrovanih mašina"
            />
          </div>
        </div>

        {/* Quick access */}
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            Brzi pristup
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/work-orders"
              className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
            >
              Radni nalozi
            </Link>

            <Link
              href="/products"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Proizvodi
            </Link>

            <Link
              href="/products/cmsmv7u6q0006y0r1pdp634lt"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Testni proizvod
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
        {icon}
      </div>

      <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>

      <div className="mt-5 text-sm font-medium text-blue-600">
        Otvori →
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="text-sm text-gray-500">
        {label}
      </div>

      <div className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </div>

      <div className="mt-1 text-sm text-gray-500">
        {description}
      </div>
    </div>
  );
}