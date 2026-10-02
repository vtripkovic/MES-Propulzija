import { NextResponse } from "next/server";
import { hashPassword, isSameSecret } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const secret = process.env.BOOTSTRAP_ADMIN_SECRET;
  const configured = Boolean(secret && secret.length >= 32);
  const adminExists = await prisma.user.count({
    where: { role: "ADMIN" },
  });
  return NextResponse.json({ available: configured && adminExists === 0 });
}

export async function POST(request: Request) {
  const secret = process.env.BOOTSTRAP_ADMIN_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { error: "Početno podešavanje administratora nije omogućeno." },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();
    const suppliedSecret =
      typeof body.secret === "string" ? body.secret : "";
    if (!isSameSecret(suppliedSecret, secret)) {
      return NextResponse.json({ error: "Neispravna tajna." }, { status: 403 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (
      !name ||
      name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      password.length < 10 ||
      password.length > 256
    ) {
      return NextResponse.json(
        { error: "Proverite ime, email adresu i lozinku (najmanje 10 karaktera)." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction(
      async (tx) => {
        const admins = await tx.user.count({ where: { role: "ADMIN" } });
        if (admins > 0) {
          throw new Error("BOOTSTRAP_ALREADY_USED");
        }
        await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "ADMIN",
            approvedAt: new Date(),
          },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return NextResponse.json(
      { message: "Administrator je kreiran. Sada se možete prijaviti." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "BOOTSTRAP_ALREADY_USED") {
      return NextResponse.json(
        { error: "Početno podešavanje je već iskorišćeno." },
        { status: 409 },
      );
    }
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Korisnik sa ovom email adresom već postoji." },
        { status: 409 },
      );
    }
    console.error("ADMIN BOOTSTRAP ERROR:", error);
    return NextResponse.json(
      { error: "Kreiranje početnog administratora nije uspelo." },
      { status: 500 },
    );
  }
}
