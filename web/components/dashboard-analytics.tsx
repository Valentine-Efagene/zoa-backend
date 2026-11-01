"use client";

import Link from "next/link";
import { BarChart3, MailWarning, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminApplications } from "@/lib/hooks";
import {
  aggregateRequestsPerCustomer,
  countByStatus,
} from "@/lib/analytics";
import type { Application } from "@/lib/types";

function PersonalOverview({
  applications,
  loading,
}: {
  applications: Application[];
  loading: boolean;
}) {
  const draftCount = applications.filter((a) => a.status === "draft").length;
  const openCount = applications.filter((a) =>
    ["submitted", "in_review", "needs_info"].includes(a.status),
  ).length;
  const completedCount = applications.filter(
    (a) => a.status === "completed",
  ).length;

  const stats = [
    { label: "Total applications", value: applications.length },
    { label: "Drafts", value: draftCount },
    { label: "In progress", value: openCount },
    { label: "Completed", value: completedCount },
  ];

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">
        Your overview
      </h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/70 bg-background/80 px-4 py-4"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-12" />
              </div>
            ))
          : stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/70 bg-background/80 px-4 py-4"
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight">
                  {stat.value}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}

function AdminOperations({ loading }: { loading: boolean }) {
  const appsQuery = useAdminApplications();
  const applications = appsQuery.data ?? [];
  const byCustomer = aggregateRequestsPerCustomer(applications);
  const topReturning = byCustomer.slice(0, 5);
  const statusCounts = countByStatus(applications);
  const uniqueCustomers = byCustomer.length;

  return (
    <div className="space-y-6 border-t border-border/70 pt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[var(--zoa-blue)]">
            <BarChart3 className="size-5" strokeWidth={1.5} aria-hidden />
            <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
              Operations analytics
            </h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cross-customer filing activity. More metrics (email verification,
            revenue, turnaround) will plug in here as requirements grow.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Open admin inbox
        </Link>
      </div>

      {appsQuery.error ? (
        <p className="text-sm text-destructive">{appsQuery.error.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {loading || appsQuery.isLoading
          ? Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/70 bg-background px-4 py-4"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-8 w-16" />
              </div>
            ))
          : [
              {
                label: "Unique customers",
                value: uniqueCustomers,
                hint: "Distinct emails or accounts with filings",
              },
              {
                label: "Non-draft filings",
                value:
                  (statusCounts.submitted ?? 0) +
                  (statusCounts.in_review ?? 0) +
                  (statusCounts.needs_info ?? 0) +
                  (statusCounts.completed ?? 0) +
                  (statusCounts.rejected ?? 0),
                hint: "Submitted and beyond",
              },
              {
                label: "Needs info",
                value: statusCounts.needs_info ?? 0,
                hint: "Awaiting applicant action",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/70 bg-background px-4 py-4"
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
              </div>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-background">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            <h4 className="text-sm font-medium">Requests per customer</h4>
          </div>
          {loading || appsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : byCustomer.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No customer activity yet.
            </p>
          ) : (
            <ul className="max-h-72 divide-y divide-border/70 overflow-y-auto">
              {byCustomer.slice(0, 12).map((row) => (
                <li
                  key={row.key}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    {row.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {row.requestCount} request
                    {row.requestCount === 1 ? "" : "s"}
                    {row.submittedCount > 0
                      ? ` · ${row.submittedCount} filed`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border/70 bg-background">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
            <BarChart3 className="size-4 text-muted-foreground" aria-hidden />
            <h4 className="text-sm font-medium">Top returning customers</h4>
          </div>
          {loading || appsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : topReturning.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Repeat filers will appear here once customers submit more than one
              application.
            </p>
          ) : (
            <ol className="divide-y divide-border/70">
              {topReturning.map((row, index) => (
                <li
                  key={row.key}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium">
                    {row.requestCount}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-4">
        <div className="flex gap-3">
          <MailWarning
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium">
              Email verification pending (coming soon)
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Accounts stuck before first sign-in (Cognito UNCONFIRMED) are not
              in filing data yet. A future admin API will list them here so ops
              can resend codes or confirm manually.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardAnalytics({
  applications,
  loading,
  isAdmin,
}: {
  applications: Application[];
  loading: boolean;
  isAdmin: boolean;
}) {
  return (
    <section className="space-y-8" aria-labelledby="dashboard-analytics-heading">
      <div>
        <h2
          id="dashboard-analytics-heading"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight"
        >
          Analytics
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Snapshot of your filings
          {isAdmin ? " and Z.O.A-wide operations" : ""}.
        </p>
      </div>

      <PersonalOverview applications={applications} loading={loading} />

      {isAdmin ? <AdminOperations loading={loading} /> : null}
    </section>
  );
}
