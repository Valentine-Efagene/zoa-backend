const MAILPIT_API =
  process.env.MAILPIT_API_URL ?? "http://127.0.0.1:8025/api/v1";

export async function waitForResetCode(
  email: string,
  options?: { timeoutMs?: number },
) {
  const timeoutMs = options?.timeoutMs ?? 20_000;
  const deadline = Date.now() + timeoutMs;
  const needle = email.toLowerCase();

  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_API}/messages`);
    if (!res.ok) {
      throw new Error(`Mailpit API error: ${res.status}`);
    }
    const data = (await res.json()) as {
      messages?: Array<{ ID: string; To?: Array<{ Address: string }> }>;
    };

    for (const message of data.messages ?? []) {
      const recipients = message.To ?? [];
      const matches = recipients.some(
        (r) => r.Address?.toLowerCase() === needle,
      );
      if (!matches) continue;

      const detailRes = await fetch(`${MAILPIT_API}/message/${message.ID}`);
      if (!detailRes.ok) continue;
      const detail = (await detailRes.json()) as { Text?: string };
      const text = detail.Text ?? "";
      const match = text.match(/\b(\d{6})\b/);
      if (match) return match[1];
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`No reset email found for ${email} within ${timeoutMs}ms`);
}
