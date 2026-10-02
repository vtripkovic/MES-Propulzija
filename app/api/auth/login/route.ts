import { NextResponse } from "next/server";
import {
  createUserSession,
  verifyPassword,
} from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: {
          select: { code: true },
        },
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Email ili lozinka nisu ispravni." },
        { status: 401 },
      );
    }
    if (!user.approvedAt) {
      return NextResponse.json(
        { error: "Nalog čeka odobrenje administratora." },
        { status: 403 },
      );
    }
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Nalog je deaktiviran. Obratite se administratoru." },
        { status: 403 },
      );
    }
    if (user.role !== "ADMIN" && !user.department) {
      return NextResponse.json(
        { error: "Nalog nema dodeljen sektor. Obratite se administratoru." },
        { status: 403 },
      );
    }

    await createUserSession(user.id);
    return NextResponse.json({
      message: "Uspešno ste prijavljeni.",
      redirectTo:
        user.role === "ADMIN"
          ? "/"
          : `/sectors/${user.department?.code}`,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Prijava trenutno nije uspela." },
      { status: 500 },
    );
  }
}
