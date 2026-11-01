"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  PageSpinner,
  WorkflowOptionSkeleton,
} from "@/components/loading";
import { useCreateApplication, useWorkflows } from "@/lib/hooks";
import type { WorkflowSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

function NewApplicationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preset = searchParams.get("workflow") as WorkflowSlug | null;
  const workflowsQuery = useWorkflows();
  const createApplication = useCreateApplication();
  const [selected, setSelected] = useState<WorkflowSlug | null>(preset);

  const workflows = workflowsQuery.data ?? [];

  function start() {
    if (!selected) return;
    createApplication.mutate(
      { workflowSlug: selected },
      {
        onSuccess: ({ application }) => {
          router.push(`/applications/${application.id}`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Could not start");
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          New application
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a registration workflow. Add directors, shareholders,
          subscribers, trustees, or beneficial owners as needed.
        </p>
      </div>

      {workflowsQuery.error ? (
        <p className="text-sm text-destructive">
          {workflowsQuery.error.message}
        </p>
      ) : null}

      <div className="space-y-3">
        {workflowsQuery.isLoading ? (
          <WorkflowOptionSkeleton count={3} />
        ) : (
          workflows.map((wf) => {
            const active = selected === wf.slug;
            return (
              <button
                key={wf.slug}
                type="button"
                onClick={() => setSelected(wf.slug)}
                className={cn(
                  "w-full rounded-xl border px-5 py-4 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                    : "border-border/70 bg-background hover:border-primary/25",
                )}
              >
                <p className="font-medium">{wf.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {wf.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {wf.estimatedDays}
                </p>
              </button>
            );
          })
        )}
      </div>

      <Button
        disabled={!selected || createApplication.isPending}
        onClick={start}
        size="lg"
      >
        {createApplication.isPending ? (
          <>
            <Spinner className="size-4" />
            Starting…
          </>
        ) : (
          "Continue to form"
        )}
      </Button>
    </div>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense fallback={<PageSpinner label="Loading workflows" />}>
      <NewApplicationInner />
    </Suspense>
  );
}
