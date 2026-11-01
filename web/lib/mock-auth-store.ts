/**
 * In-memory credentials + reset codes for UAT when Cognito is not configured.
 * Server-only — never import from client components.
 */

export type MockUserRecord = {
  password: string;
  resetCode?: string;
  resetExpiresAt?: number;
};

const users = new Map<string, MockUserRecord>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function mockAuthEnabled() {
  return process.env.MOCK_AUTH_EMAIL === "true";
}

export function mockRegisterUser(email: string, password: string) {
  users.set(normalizeEmail(email), { password });
}

export function mockVerifyPassword(email: string, password: string) {
  const record = users.get(normalizeEmail(email));
  if (!record) return false;
  return record.password === password;
}

export function mockUserExists(email: string) {
  return users.has(normalizeEmail(email));
}

export function mockSetResetCode(email: string, code: string, ttlMs: number) {
  const key = normalizeEmail(email);
  const existing = users.get(key);
  if (!existing) return false;
  existing.resetCode = code;
  existing.resetExpiresAt = Date.now() + ttlMs;
  users.set(key, existing);
  return true;
}

export function mockConfirmReset(
  email: string,
  code: string,
  newPassword: string,
) {
  const key = normalizeEmail(email);
  const record = users.get(key);
  if (!record?.resetCode || !record.resetExpiresAt) return false;
  if (Date.now() > record.resetExpiresAt) return false;
  if (record.resetCode !== code.trim()) return false;
  record.password = newPassword;
  delete record.resetCode;
  delete record.resetExpiresAt;
  users.set(key, record);
  return true;
}

/** Test helper — not for production use */
export function mockClearAll() {
  users.clear();
}
