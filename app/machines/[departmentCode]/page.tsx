import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { prisma } from "@/app/lib/prisma";

import DeleteMachineButton from "@/app/machines/delete-machine-button";
import { deleteMachine } from "@/app/machines/actions";

type MachinesPageProps = {
  params: Promise<{
    departmentCode: string;
  }>;
};

export default async function MachinesBySectorPage({
  params,
}: MachinesPageProps) {
  const { departmentCode } = await params;

  const department = await prisma.department.findUnique({
    where: {
      code: departmentCode,
    },
    include: {
      machines: {
        orderBy: {
          code: "asc",
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-2">
              <Link
                href="/machines"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← Mašine
              </Link>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {department.name}
                  </h1>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {department.code}
                  </span>
                </div>

                <p className="mt-2 text-gray-700">
                  Mašine u ovom sektoru
                </p>
              </div>

              <Link
                href={`/machines/${department.code}/new`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                + Ubaci novu mašinu
              </Link>
            </div>
          </div>

          {/* Machines */}
          {department.machines.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                ⚙
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Nema mašina
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                U ovom sektoru trenutno nema definisanih mašina.
              </p>

              <div className="mt-6">
                <Link
                  href={`/machines/${department.code}/new`}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Ubaci novu mašinu
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Kod
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Naziv mašine
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Akcije
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {department.machines.map((machine) => (
                      <tr
                        key={machine.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">
                            {machine.code}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {machine.name}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/machines/${department.code}/${machine.id}/edit`}
                              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              Izmeni
                            </Link>

                            <DeleteMachineButton
  action={deleteMachine.bind(
    null,
    machine.id,
    department.code,
  )}
/>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}