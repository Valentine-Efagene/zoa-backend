import { NextResponse } from "next/server";
import { sendMockAuthEmail } from "@/lib/mock-auth-mail";
import {
  mockAuthEnabled,
  mockSetResetCode,
  mockUserExists,
} from "@/lib/mock-auth-store";

const RESET_TTL_MS = 15 * 60 * 1000;

function generateCode() {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

export async function POST(request: Request) {
  if (!mockAuthEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Cognito-style: do not reveal whether the user exists
  if (!mockUserExists(email)) {
    return NextResponse.json({ ok: true });
  }

  const code = generateCode();
  const saved = mockSetResetCode(email, code, RESET_TTL_MS);
  if (!saved) {
    return NextResponse.json({ ok: true });
  }

  await sendMockAuthEmail(
    email,
    "Z.O.A password reset code",
    `Your password reset code is ${code}. It expires in 15 minutes.`,
  );

  return NextResponse.json({ ok: true });
}
