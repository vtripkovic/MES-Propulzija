"use client";

import { useActionState } from "react";

type NewMachineFormProps = {
  action: (
    previousState: {
      success: boolean;
      message: string;
    },
    formData: FormData,
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  departmentCode: string;
  departmentName: string;
};

const initialState = {
  success: false,
  message: "",
};

export default function NewMachineForm({
  action,
  departmentCode,
  departmentName,
}: NewMachineFormProps) {
  const [state, formAction] = useActionState(
    action,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
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
          required
          placeholder="npr. HP-LATEX-2000-03"
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
          required
          placeholder="npr. HP Latex 2000"
          className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900">
          Sektor
        </label>

        <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <span className="rounded-md bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
            {departmentCode}
          </span>

          <span className="text-sm text-gray-700">
            {departmentName}
          </span>
        </div>
      </div>

      {state.message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.success
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
        <a
          href={`/machines/${departmentCode}`}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Otkaži
        </a>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Sačuvaj mašinu
        </button>
      </div>
    </form>
  );
}