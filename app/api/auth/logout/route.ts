import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/app/lib/auth";

export async function POST() {
  try {
    await destroyCurrentSession();
    return NextResponse.json({ message: "Uspešno ste odjavljeni." });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return NextResponse.json(
      { error: "Odjava trenutno nije uspela." },
      { status: 500 },
    );
  }
}
