"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/loading";
import { useApplications, useWorkflows } from "@/lib/hooks";
import { STATUS_LABELS } from "@/lib/types";

export default function ApplicationsPage() {
  const applicationsQuery = useApplications();
  const workflowsQuery = useWorkflows();

  const applications = applicationsQuery.data ?? [];
  const workflows = workflowsQuery.data ?? [];
  const loading = applicationsQuery.isLoading || workflowsQuery.isLoading;
  const error =
    applicationsQuery.error?.message ?? workflowsQuery.error?.message ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Applications
        </h1>
        <Button render={<Link href="/applications/new" />}>
          New application
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-background">
          {applications.map((app) => (
            <li key={app.id}>
              <Link
                href={`/applications/${app.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-medium">
                    {workflows.find((w) => w.slug === app.workflowSlug)?.name ??
                      app.workflowSlug}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(app.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary">{STATUS_LABELS[app.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
