"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteMachine(
  machineId: string,
  departmentCode: string,
) {
  const machine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
    include: {
      _count: {
        select: {
          operationMachines: true,
          operationExecutions: true,
        },
      },
    },
  });

  if (!machine) {
    throw new Error("Mašina nije pronađena.");
  }

  if (
    machine._count.operationMachines > 0 ||
    machine._count.operationExecutions > 0
  ) {
    throw new Error(
      "Mašina ne može biti obrisana jer je već povezana sa operacijama ili proizvodnim izvršenjima.",
    );
  }

  await prisma.machine.delete({
    where: {
      id: machineId,
    },
  });

  revalidatePath(`/machines/${departmentCode}`);
  revalidatePath("/machines");
}

export async function createMachine(
  departmentCode: string,
  previousState: {
    success: boolean;
    message: string;
  },
  formData: FormData,
) {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!code) {
    return {
      success: false,
      message: "Kod mašine je obavezan.",
    };
  }

  if (!name) {
    return {
      success: false,
      message: "Naziv mašine je obavezan.",
    };
  }

  const department = await prisma.department.findUnique({
    where: {
      code: departmentCode,
    },
  });

  if (!department) {
    return {
      success: false,
      message: "Sektor nije pronađen.",
    };
  }

  const existingMachine = await prisma.machine.findUnique({
    where: {
      code,
    },
  });

  if (existingMachine) {
    return {
      success: false,
      message: `Mašina sa kodom "${code}" već postoji.`,
    };
  }

  await prisma.machine.create({
    data: {
      code,
      name,
      departmentId: department.id,
    },
  });

  revalidatePath(`/machines/${departmentCode}`);
  revalidatePath("/machines");

  return {
    success: true,
    message: "Mašina je uspešno dodata.",
  };
}

export async function updateMachine(
  machineId: string,
  departmentCode: string,
  formData: FormData,
) {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!code) {
    throw new Error("Kod mašine je obavezan.");
  }

  if (!name) {
    throw new Error("Naziv mašine je obavezan.");
  }

  const machine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
  });

  if (!machine) {
    throw new Error("Mašina nije pronađena.");
  }

  const existingMachine = await prisma.machine.findFirst({
    where: {
      code,
      NOT: {
        id: machineId,
      },
    },
  });

  if (existingMachine) {
    throw new Error(
      `Mašina sa kodom "${code}" već postoji.`,
    );
  }

  await prisma.machine.update({
    where: {
      id: machineId,
    },
    data: {
      code,
      name,
    },
  });

  revalidatePath(`/machines/${departmentCode}`);
  revalidatePath(
    `/machines/${departmentCode}/${machineId}/edit`,
  );
  revalidatePath("/machines");
}