import { NextResponse } from "next/server";
import {
  mockAuthEnabled,
  mockConfirmReset,
} from "@/lib/mock-auth-store";

export async function POST(request: Request) {
  if (!mockAuthEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = (await request.json()) as {
    email?: string;
    code?: string;
    password?: string;
  };

  const email = body.email?.trim();
  const code = body.code?.trim();
  const password = body.password;
  if (!email || !code || !password) {
    return NextResponse.json(
      { error: "Email, code, and new password required" },
      { status: 400 },
    );
  }

  const ok = mockConfirmReset(email, code, password);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
