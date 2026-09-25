import Link from "next/link";

import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { prisma } from "@/app/lib/prisma";

export default async function SectorsPage() {
  const sectors = await prisma.department.findMany({
    orderBy: {
      code: "asc",
    },
    include: {
      _count: {
        select: {
          machines: true,
        },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-2">
              <Link
                href="/"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← Početna
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Sektori
            </h1>

            <p className="mt-2 text-gray-700">
              Pregled proizvodnih sektora i trenutnih poslova
            </p>
          </div>

          {/* Sektori */}
          {sectors.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-gray-700">
                Nema definisanih sektora.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sectors.map((sector) => (
                <Link
                  key={sector.id}
                  href={`/sectors/${sector.code}`}
                  className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-2xl text-blue-600">
                      🏭
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      {sector.code}
                    </span>
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                    {sector.name}
                  </h2>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Mašine
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {sector._count.machines}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-blue-600">
                      Otvori →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}