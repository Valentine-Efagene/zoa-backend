"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequireAdmin } from "@/components/require-admin";
import { ListSkeleton } from "@/components/loading";
import { useAdminApplications, useWorkflows } from "@/lib/hooks";
import type { ApplicationStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All (non-draft)" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "needs_info", label: "Needs info" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

function AdminInbox() {
  const [filter, setFilter] = useState("all");
  const status = filter === "all" ? undefined : filter;
  const appsQuery = useAdminApplications(status);
  const workflowsQuery = useWorkflows();

  const applications = appsQuery.data ?? [];
  const workflows = workflowsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            Application inbox
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review submitted filings and update status for applicants.
          </p>
        </div>
        <div className="w-48">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v == null ? "all" : String(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {appsQuery.error ? (
        <p className="text-sm text-destructive">{appsQuery.error.message}</p>
      ) : null}

      {appsQuery.isLoading ? (
        <ListSkeleton rows={6} />
      ) : applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications match.</p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-background">
          {applications.map((app) => (
            <li key={app.id}>
              <Link
                href={`/admin/applications/${app.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-medium">
                    {workflows.find((w) => w.slug === app.workflowSlug)?.name ??
                      app.workflowSlug}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {app.applicantName || app.applicantEmail || app.userId}
                    {" · "}
                    Updated {new Date(app.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary">
                  {STATUS_LABELS[app.status as ApplicationStatus]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminInbox />
    </RequireAdmin>
  );
}
