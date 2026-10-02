import { NextResponse } from "next/server";
import { authorizeApi } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const auth = await authorizeApi(true);
  if (auth.response) return auth.response;

  try {
    const [users, departments] = await Promise.all([
      prisma.user.findMany({
        orderBy: [{ approvedAt: "asc" }, { name: "asc" }],
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          approvedAt: true,
          isActive: true,
          departmentId: true,
          department: { select: { id: true, code: true, name: true } },
          createdAt: true,
        },
      }),
      prisma.department.findMany({
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true },
      }),
    ]);
    return NextResponse.json({ users, departments });
  } catch (error) {
    console.error("USERS SETTINGS GET ERROR:", error);
    return NextResponse.json(
      { error: "Greška pri učitavanju korisnika." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi(true);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!userId) {
      return NextResponse.json({ error: "Korisnik nije izabran." }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ error: "Korisnik nije pronađen." }, { status: 404 });
    }

    const role =
      body.role === undefined
        ? existing.role
        : body.role === "ADMIN" || body.role === "USER"
          ? body.role
          : null;
    const isActive =
      body.isActive === undefined
        ? existing.isActive
        : typeof body.isActive === "boolean"
          ? body.isActive
          : null;
    const approved =
      body.approved === undefined
        ? Boolean(existing.approvedAt)
        : typeof body.approved === "boolean"
          ? body.approved
          : null;
    const departmentId =
      body.departmentId === undefined
        ? existing.departmentId
        : body.departmentId === null || typeof body.departmentId === "string"
          ? body.departmentId
          : undefined;

    if (role === null || isActive === null || approved === null || departmentId === undefined) {
      return NextResponse.json({ error: "Neispravna podešavanja korisnika." }, { status: 400 });
    }
    if (role === "USER" && (approved || isActive) && !departmentId) {
      return NextResponse.json(
        { error: "Pre odobravanja ili aktiviranja korisniku dodelite sektor." },
        { status: 400 },
      );
    }
    if (role === "ADMIN" && !approved) {
      return NextResponse.json(
        { error: "Administratorski nalog mora ostati odobren." },
        { status: 400 },
      );
    }
    if (role === "ADMIN" && departmentId) {
      return NextResponse.json(
        { error: "Administrator nema ograničenje na sektor." },
        { status: 400 },
      );
    }
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });
      if (!department) {
        return NextResponse.json({ error: "Izabrani sektor ne postoji." }, { status: 400 });
      }
    }

    const nextApprovedAt = approved ? existing.approvedAt ?? new Date() : null;
    const removingAdmin =
      existing.role === "ADMIN" &&
      existing.isActive &&
      existing.approvedAt &&
      (role !== "ADMIN" || !isActive || !approved);

    const updated = await prisma.$transaction(async (tx) => {
      if (removingAdmin) {
        const activeAdmins = await tx.user.count({
          where: { role: "ADMIN", isActive: true, approvedAt: { not: null } },
        });
        if (activeAdmins <= 1) {
          throw new Error("LAST_ACTIVE_ADMIN");
        }
      }
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          role,
          isActive,
          approvedAt: nextApprovedAt,
          departmentId: role === "ADMIN" ? null : departmentId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          approvedAt: true,
          isActive: true,
          departmentId: true,
        },
      });
      await tx.session.deleteMany({ where: { userId } });
      return user;
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ACTIVE_ADMIN") {
      return NextResponse.json(
        { error: "U sistemu mora ostati najmanje jedan aktivan administrator." },
        { status: 409 },
      );
    }
    console.error("USERS SETTINGS PATCH ERROR:", error);
    return NextResponse.json(
      { error: "Izmena korisnika nije uspela." },
      { status: 500 },
    );
  }
}
