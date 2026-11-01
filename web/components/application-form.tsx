"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FieldsGrid,
  RepeatableGroupEditor,
  SectionHeader,
  SingularEditor,
  emptyPerson,
} from "@/components/form-fields";
import { DocumentUploader } from "@/components/document-uploader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUpdateApplication } from "@/lib/hooks";
import type {
  Application,
  ApplicationDocument,
  FormDataMap,
  PersonRecord,
  WorkflowDefinition,
} from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

function ensureGroups(
  workflow: WorkflowDefinition,
  formData: FormDataMap,
): FormDataMap {
  const next = { ...formData };
  for (const group of workflow.groups) {
    if (!Array.isArray(next[group.id])) {
      next[group.id] = Array.from({ length: group.minItems }, () =>
        emptyPerson(group.fields),
      );
    }
  }
  for (const singular of workflow.singulars ?? []) {
    if (next[singular.id] === undefined) {
      next[singular.id] = singular.optional
        ? null
        : emptyPerson(singular.fields);
    }
  }
  return next;
}

export function ApplicationForm({
  application: initialApp,
  workflow,
  forceReadOnly = false,
}: {
  application: Application;
  workflow: WorkflowDefinition;
  /** Admin review: always read-only regardless of status */
  forceReadOnly?: boolean;
}) {
  const router = useRouter();
  const updateApplication = useUpdateApplication(initialApp.id);
  const [formData, setFormData] = useState<FormDataMap>(() =>
    ensureGroups(workflow, initialApp.formData),
  );
  const [documents, setDocuments] = useState(initialApp.documents);
  const [singularEnabled, setSingularEnabled] = useState<
    Record<string, boolean>
  >(() => {
    const map: Record<string, boolean> = {};
    for (const s of workflow.singulars ?? []) {
      map[s.id] = s.optional
        ? Boolean(initialApp.formData[s.id])
        : true;
    }
    return map;
  });

  useEffect(() => {
    setDocuments(initialApp.documents);
  }, [initialApp.documents]);

  const trusteeOptions = useMemo(() => {
    const trustees = formData.trustees;
    if (!Array.isArray(trustees)) return [] as string[];
    return (trustees as PersonRecord[]).map((t, i) => {
      const name = [t.firstName, t.surname].filter(Boolean).join(" ");
      return name ? `Trustee ${i + 1} — ${name}` : `Trustee ${i + 1}`;
    });
  }, [formData.trustees]);

  function setField(id: string, value: string) {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }

  function onDocumentUploaded(doc: ApplicationDocument) {
    setDocuments((prev) => {
      const without = prev.filter(
        (d) =>
          !(
            d.documentType === doc.documentType &&
            (d.ownerKey ?? "") === (doc.ownerKey ?? "")
          ),
      );
      return [...without, doc];
    });
  }

  function save(status?: Application["status"]) {
    updateApplication.mutate(
      {
        formData,
        ...(status ? { status } : {}),
      },
      {
        onSuccess: () => {
          toast.success(
            status === "submitted" ? "Application submitted" : "Draft saved",
          );
          if (status === "submitted") {
            router.push("/dashboard");
          }
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Save failed");
        },
      },
    );
  }

  const status = updateApplication.data?.application.status ?? initialApp.status;
  const readOnly =
    forceReadOnly || (status !== "draft" && status !== "needs_info");
  const pending = updateApplication.isPending;
  /** Don't use disabled fieldset for admin — download/copy must stay clickable */
  const lockEditing = readOnly || pending;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Application</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            {workflow.name}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {workflow.description}
          </p>
        </div>
        <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>
      </div>

      {initialApp.adminNote && status === "needs_info" && !forceReadOnly ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            More information required
          </p>
          <p className="mt-1 text-muted-foreground">{initialApp.adminNote}</p>
        </div>
      ) : null}

      <div className="space-y-10">
        <section className="space-y-4">
          <SectionHeader
            title="Organisation details"
            description="Core information from the questionnaire"
          />
          <div className="rounded-xl border border-border/80 bg-background p-4 sm:p-5">
            <FieldsGrid
              fields={workflow.fields}
              values={Object.fromEntries(
                workflow.fields.map((f) => [
                  f.id,
                  typeof formData[f.id] === "string"
                    ? (formData[f.id] as string)
                    : "",
                ]),
              )}
              onChange={setField}
              selectOptions={
                workflow.slug === "incorporated-trustees"
                  ? { chairmanTrusteeIndex: trusteeOptions }
                  : undefined
              }
              showCopy={forceReadOnly}
              readOnly={lockEditing}
            />
          </div>
        </section>

        {workflow.groups.map((group) => (
          <div key={group.id}>
            <Separator className="mb-8" />
            <RepeatableGroupEditor
              group={group}
              items={
                (Array.isArray(formData[group.id])
                  ? formData[group.id]
                  : []) as PersonRecord[]
              }
              onChange={(items) =>
                setFormData((prev) => ({ ...prev, [group.id]: items }))
              }
              applicationId={initialApp.id}
              documents={documents}
              onDocumentUploaded={onDocumentUploaded}
              showCopy={forceReadOnly}
              readOnly={lockEditing}
              downloadOnly={forceReadOnly}
            />
          </div>
        ))}

        {(workflow.singulars ?? []).map((singular) => (
          <div key={singular.id}>
            <Separator className="mb-8" />
            <SingularEditor
              singular={singular}
              value={(formData[singular.id] as PersonRecord | null) ?? null}
              enabled={singularEnabled[singular.id] ?? !singular.optional}
              onEnabledChange={(enabled) =>
                setSingularEnabled((prev) => ({
                  ...prev,
                  [singular.id]: enabled,
                }))
              }
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, [singular.id]: value }))
              }
              applicationId={initialApp.id}
              documents={documents}
              onDocumentUploaded={onDocumentUploaded}
              showCopy={forceReadOnly}
              readOnly={lockEditing}
              downloadOnly={forceReadOnly}
            />
          </div>
        ))}

        {workflow.documents.length > 0 ? (
          <div>
            <Separator className="mb-8" />
            <section className="space-y-4">
              <SectionHeader title="Supporting documents" />
              <div className="rounded-xl border border-border/80 bg-background p-4 sm:p-5">
                <DocumentUploader
                  applicationId={initialApp.id}
                  docs={workflow.documents}
                  uploaded={documents}
                  onUploaded={onDocumentUploaded}
                  downloadOnly={forceReadOnly}
                />
              </div>
            </section>
          </div>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border/60 bg-[var(--zoa-canvas)]/95 py-4 backdrop-blur-sm">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => save()}
          >
            {pending ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => save("submitted")}
          >
            {status === "needs_info"
              ? "Resubmit application"
              : "Submit application"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Typical turnaround: {workflow.estimatedDays}
          </p>
        </div>
      ) : null}
    </div>
  );
}
