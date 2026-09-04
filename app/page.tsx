"use client";

import Link from "next/link";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="flex-1 px-6 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Hero section */}
          <div className="mb-12 text-center">
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
              Manufacturing System
            </p>
            <h1 className="mt-3 text-5xl font-bold text-gray-900">
              MES Propulzija
            </h1>
            <p className="mt-4 text-xl text-gray-700 max-w-2xl mx-auto">
              Kompletan sistem za upravljanje proizvodnjom, praćenje operacija i optimizaciju proizvodnog procesa
            </p>
          </div>

          {/* Main navigation cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <DashboardCard
              href="/production"
              title="Proizvodi"
              description="Upravljanje proizvodima i BOM strukturom"
              icon="📦"
              color="blue"
            />

            <DashboardCard
              href="/machines"
              title="Mašine"
              description="Pregled i upravljanje proizvodnim mašinama"
              icon="⚙️"
              color="green"
            />

            <DashboardCard
              href="/work-orders/new"
              title="Radne narudžbine"
              description="Kreiranje i praćenje radnih narudžbina"
              icon="📋"
              color="orange"
            />

            <DashboardCard
              href="/production"
              title="Proizvodnja"
              description="Pregled proizvodnog procesa u realnom vremenu"
              icon="🏭"
              color="purple"
            />
          </div>

          {/* Stats section */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-12">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
              <h2 className="text-lg font-bold text-gray-900">
                Pregled sistema
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Brzi uvid u stanje proizvodnog sistema
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4 p-6">
              <StatCard
                icon="📦"
                label="Proizvodi"
                value="8"
                description="u sistemu"
              />

              <StatCard
                icon="⚙️"
                label="Mašine"
                value="5"
                description="dostupnih"
              />

              <StatCard
                icon="📋"
                label="Operacije"
                value="12"
                description="definisano"
              />

              <StatCard
                icon="✓"
                label="Status"
                value="OK"
                description="sistem spreman"
              />
            </div>
          </div>

          {/* Quick access */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-5">
              <h2 className="text-lg font-bold text-gray-900">
                Brz pristup
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Česte aktivnosti i akcije
              </p>
            </div>

            <div className="p-6 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 transition-colors"
              >
                → Proizvodi
              </Link>

              <Link
                href="/machines"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 transition-colors"
              >
                → Mašine
              </Link>

              <Link
                href="/work-orders/new"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 font-medium text-white hover:bg-orange-700 transition-colors"
              >
                → Nova radna narudžbina
              </Link>

              <Link
                href="/production"
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white hover:bg-purple-700 transition-colors"
              >
                → Proizvodnja
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DashboardCard({
  href,
  title,
  description,
  icon,
  color = "blue",
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
  color?: "blue" | "green" | "orange" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-100 hover:border-blue-200 hover:from-blue-50",
    green: "bg-green-100 hover:border-green-200 hover:from-green-50",
    orange: "bg-orange-100 hover:border-orange-200 hover:from-orange-50",
    purple: "bg-purple-100 hover:border-purple-200 hover:from-purple-50",
  };

  const textColorClasses = {
    blue: "group-hover:text-blue-600",
    green: "group-hover:text-green-600",
    orange: "group-hover:text-orange-600",
    purple: "group-hover:text-purple-600",
  };

  const iconBgClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg ${colorClasses[color]}`}
    >
      <div className="relative">
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${iconBgClasses[color]}`}>
          {icon}
        </div>

        <h3 className={`text-lg font-bold text-gray-900 ${textColorClasses[color]}`}>
          {title}
        </h3>

        <p className="mt-2 text-sm text-gray-700">
          {description}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
          Otvori
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-700">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
