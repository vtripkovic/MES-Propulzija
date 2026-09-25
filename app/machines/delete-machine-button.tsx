"use client";

import { FormEvent } from "react";

type DeleteMachineButtonProps = {
  action: () => Promise<void>;
};

export default function DeleteMachineButton({
  action,
}: DeleteMachineButtonProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      "Da li ste sigurni da želite da obrišete ovu mašinu?",
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <button
        type="submit"
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Obriši
      </button>
    </form>
  );
}