import type { Application } from "@/lib/types";

export type CustomerRequestStat = {
  key: string;
  label: string;
  requestCount: number;
  submittedCount: number;
  lastActivityAt: string;
};

export function customerKey(app: Application): string {
  return (app.applicantEmail?.trim().toLowerCase() ||
    app.userId ||
    app.id) as string;
}

export function customerLabel(app: Application): string {
  return (
    app.applicantName?.trim() ||
    app.applicantEmail?.trim() ||
    app.userId ||
    "Unknown customer"
  );
}

/** Group applications by customer for ops analytics (admin data). */
export function aggregateRequestsPerCustomer(
  applications: Application[],
): CustomerRequestStat[] {
  const map = new Map<
    string,
    CustomerRequestStat & { _lastMs: number }
  >();

  for (const app of applications) {
    const key = customerKey(app);
    const label = customerLabel(app);
    const existing = map.get(key);
    const updatedMs = new Date(app.updatedAt).getTime();
    const isSubmitted = app.status !== "draft";

    if (!existing) {
      map.set(key, {
        key,
        label,
        requestCount: 1,
        submittedCount: isSubmitted ? 1 : 0,
        lastActivityAt: app.updatedAt,
        _lastMs: updatedMs,
      });
      continue;
    }

    existing.requestCount += 1;
    if (isSubmitted) existing.submittedCount += 1;
    if (updatedMs > existing._lastMs) {
      existing._lastMs = updatedMs;
      existing.lastActivityAt = app.updatedAt;
    }
  }

  return [...map.values()]
    .sort((a, b) => b.requestCount - a.requestCount)
    .map(({ _lastMs: _, ...row }) => row);
}

export function countByStatus(applications: Application[]) {
  const counts: Record<string, number> = {};
  for (const app of applications) {
    counts[app.status] = (counts[app.status] ?? 0) + 1;
  }
  return counts;
}
