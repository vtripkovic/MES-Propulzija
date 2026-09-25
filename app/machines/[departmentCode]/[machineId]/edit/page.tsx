import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { prisma } from "@/app/lib/prisma";

import { updateMachine } from "@/app/machines/actions";

type EditMachinePageProps = {
  params: Promise<{
    departmentCode: string;
    machineId: string;
  }>;
};

export default async function EditMachinePage({
  params,
}: EditMachinePageProps) {
  const { departmentCode, machineId } = await params;

  const machine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
    include: {
      department: true,
    },
  });

  if (!machine || machine.department.code !== departmentCode) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-10 md:px-8">
          <div className="mb-8">
            <div className="mb-2">
              <Link
                href={`/machines/${machine.department.code}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← {machine.department.name}
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Izmena mašine
            </h1>

            <p className="mt-2 text-gray-700">
              Izmena podataka za mašinu{" "}
              <span className="font-semibold">
                {machine.name}
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <form
  action={updateMachine.bind(
    null,
    machine.id,
    machine.department.code,
  )}
  className="space-y-6"
>
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Kod mašine
                </label>

                <input
                  id="code"
                  name="code"
                  type="text"
                  defaultValue={machine.code}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Kod mora biti jedinstven u sistemu.
                </p>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Naziv mašine
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={machine.name}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Sektor
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  <span className="rounded-md bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {machine.department.code}
                  </span>

                  <span className="text-sm text-gray-700">
                    {machine.department.name}
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Sektor se za sada ne menja prilikom izmene mašine.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                <Link
                  href={`/machines/${machine.department.code}`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Otkaži
                </Link>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Sačuvaj izmene
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}