import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { prisma } from "@/app/lib/prisma";

import { createMachine } from "@/app/machines/actions";
import NewMachineForm from "@/app/machines/[departmentCode]/new/new-machine-form";


type NewMachinePageProps = {
  params: Promise<{
    departmentCode: string;
  }>;
};

export default async function NewMachinePage({
  params,
}: NewMachinePageProps) {
  const { departmentCode } = await params;

  const department = await prisma.department.findUnique({
    where: {
      code: departmentCode,
    },
  });

  if (!department) {
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
                href={`/machines/${department.code}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← {department.name}
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Nova mašina
            </h1>

            <p className="mt-2 text-gray-700">
              Dodavanje nove mašine u sektor{" "}
              <span className="font-semibold">
                {department.name}
              </span>{" "}
              ({department.code})
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
  <NewMachineForm
    action={createMachine.bind(null, department.code)}
    departmentCode={department.code}
    departmentName={department.name}
  />
</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}