import { NextResponse } from "next/server";
import {
  mockAuthEnabled,
  mockVerifyPassword,
  mockUserExists,
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

  if (!mockUserExists(email)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const ok = mockVerifyPassword(email, password);
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
