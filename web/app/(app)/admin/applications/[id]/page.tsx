"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RequireAdmin } from "@/components/require-admin";
import { ApplicationForm } from "@/components/application-form";
import { FormPageSkeleton } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminApplication,
  useAdminUpdateApplication,
} from "@/lib/hooks";
import type { ApplicationStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const ADMIN_STATUSES: Exclude<ApplicationStatus, "draft">[] = [
  "submitted",
  "in_review",
  "needs_info",
  "completed",
  "rejected",
];

function AdminApplicationDetail() {
  const params = useParams<{ id: string }>();
  const query = useAdminApplication(params.id);
  const update = useAdminUpdateApplication(params.id ?? "");

  const app = query.data?.application;
  const workflow = query.data?.workflow;

  const [status, setStatus] = useState<Exclude<ApplicationStatus, "draft">>(
    "submitted",
  );
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (!app) return;
    if (app.status !== "draft") {
      setStatus(app.status);
    }
    setAdminNote(app.adminNote ?? "");
  }, [app]);

  function saveStatus() {
    if (!params.id || !app) return;
    update.mutate(
      { status, adminNote: adminNote || undefined },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Update failed"),
      },
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        {query.error instanceof Error ? query.error.message : "Failed to load"}
      </p>
    );
  }

  if (query.isLoading || !app || !workflow) {
    return <FormPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Inbox
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight">
            Review application
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {app.applicantName || app.applicantEmail || app.userId}
            {app.applicantEmail && app.applicantName
              ? ` · ${app.applicantEmail}`
              : ""}
          </p>
        </div>
        <Badge variant="secondary">{STATUS_LABELS[app.status]}</Badge>
      </div>

      <section className="space-y-4 rounded-xl border border-border/80 bg-background p-4 sm:p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg tracking-tight">
          Admin actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(
                  (v == null
                    ? "submitted"
                    : String(v)) as Exclude<ApplicationStatus, "draft">,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>Note to applicant</FieldLabel>
            <Textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Please re-upload means of ID for Director 2"
            />
          </Field>
        </div>
        <Button type="button" disabled={update.isPending} onClick={saveStatus}>
          {update.isPending ? (
            <>
              <Spinner className="size-4" />
              Saving…
            </>
          ) : (
            "Update status"
          )}
        </Button>
      </section>

      {app.adminNote ? (
        <p className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
          <span className="font-medium">Current note: </span>
          {app.adminNote}
        </p>
      ) : null}

      <ApplicationForm
        application={app}
        workflow={workflow}
        forceReadOnly
      />
    </div>
  );
}

export default function AdminApplicationPage() {
  return (
    <RequireAdmin>
      <AdminApplicationDetail />
    </RequireAdmin>
  );
}
