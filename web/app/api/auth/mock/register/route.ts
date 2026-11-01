import { NextResponse } from "next/server";
import {
  mockAuthEnabled,
  mockRegisterUser,
} from "@/lib/mock-auth-store";

export async function POST(request: Request) {
  if (!mockAuthEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  mockRegisterUser(email, password);
  return NextResponse.json({ ok: true });
}
