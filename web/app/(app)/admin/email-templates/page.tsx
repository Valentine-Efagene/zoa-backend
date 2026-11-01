"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RequireAdmin } from "@/components/require-admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListSkeleton } from "@/components/loading";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminEmailTemplate,
  useAdminEmailTemplatePreview,
  useAdminEmailTemplates,
} from "@/lib/hooks";
import { cn } from "@/lib/utils";

function EmailTemplatesAdmin() {
  const listQuery = useAdminEmailTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"text" | "html">("html");
  const [variables, setVariables] = useState<Record<string, string>>({});

  const templates = listQuery.data ?? [];

  useEffect(() => {
    if (!selectedId && templates.length > 0) {
      setSelectedId(templates[0].id);
    }
  }, [selectedId, templates]);

  const detailQuery = useAdminEmailTemplate(selectedId ?? undefined);

  useEffect(() => {
    if (detailQuery.data?.sampleVariables) {
      setVariables(detailQuery.data.sampleVariables);
    }
  }, [detailQuery.data?.id, detailQuery.data?.sampleVariables]);

  const previewQuery = useAdminEmailTemplatePreview(
    selectedId ?? undefined,
    variables,
  );

  const variableKeys = useMemo(
    () => Object.keys(variables).sort(),
    [variables],
  );

  const selectedMeta = templates.find((t) => t.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            Email templates
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Preview transactional emails stored in the database. Editing is not
            available here yet — update defaults in the API repo and re-seed.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin" />}>
          Back to inbox
        </Button>
      </div>

      {listQuery.error ? (
        <p className="text-sm text-destructive">{listQuery.error.message}</p>
      ) : null}

      {listQuery.isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates</CardTitle>
              <CardDescription>Layout plus six message bodies</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/70">
                {templates.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                        selectedId === t.id && "bg-muted/60",
                      )}
                    >
                      <p className="font-medium">{t.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.kind === "layout" ? "Layout" : "Message"} · {t.id}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {selectedMeta ? (
              <div>
                <h2 className="text-lg font-medium">{selectedMeta.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMeta.description}
                </p>
              </div>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sample data</CardTitle>
                <CardDescription>
                  Override placeholders used in the preview (does not change
                  stored templates).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {variableKeys.map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`var-${key}`}>{`{{${key}}}`}</Label>
                    {variables[key]?.length > 80 ? (
                      <Textarea
                        id={`var-${key}`}
                        value={variables[key] ?? ""}
                        onChange={(e) =>
                          setVariables((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={`var-${key}`}
                        value={variables[key] ?? ""}
                        onChange={(e) =>
                          setVariables((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Preview</CardTitle>
                  <CardDescription>
                    Rendered output (same as a live send).
                  </CardDescription>
                </div>
                <div className="flex gap-1 rounded-lg border border-border/70 p-0.5">
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium",
                      previewTab === "text" && "bg-muted",
                    )}
                    onClick={() => setPreviewTab("text")}
                  >
                    Plain text
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium",
                      previewTab === "html" && "bg-muted",
                    )}
                    onClick={() => setPreviewTab("html")}
                  >
                    HTML
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewQuery.isLoading || detailQuery.isLoading ? (
                  <ListSkeleton rows={3} />
                ) : previewQuery.error ? (
                  <p className="text-sm text-destructive">
                    {previewQuery.error.message}
                  </p>
                ) : previewQuery.data ? (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Subject
                      </p>
                      <p className="mt-1 text-sm">{previewQuery.data.subject}</p>
                    </div>
                    {previewTab === "text" ? (
                      <pre className="max-h-[420px] overflow-auto rounded-lg border border-border/70 bg-muted/30 p-4 text-xs whitespace-pre-wrap">
                        {previewQuery.data.text}
                      </pre>
                    ) : (
                      <iframe
                        title="HTML email preview"
                        className="h-[420px] w-full rounded-lg border border-border/70 bg-white"
                        sandbox=""
                        srcDoc={previewQuery.data.html}
                      />
                    )}
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEmailTemplatesPage() {
  return (
    <RequireAdmin>
      <EmailTemplatesAdmin />
    </RequireAdmin>
  );
}
