import { NextResponse } from "next/server";
import { hashPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Unesite ime i prezime (najviše 100 karaktera)." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Unesite ispravnu email adresu." }, { status: 400 });
    }
    if (password.length < 10 || password.length > 256) {
      return NextResponse.json(
        { error: "Lozinka mora imati između 10 i 256 karaktera." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: { name, email, passwordHash },
    });

    return NextResponse.json(
      { message: "Registracija je poslata administratoru na odobrenje." },
      { status: 201 },
    );
  } catch (error) {
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
    console.error("REGISTRATION ERROR:", error);
    return NextResponse.json(
      { error: "Registracija trenutno nije uspela." },
      { status: 500 },
    );
  }
}
