"use client";

import { CheckIcon, CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUploader } from "@/components/document-uploader";
import type {
  ApplicationDocument,
  PersonRecord,
  WorkflowField,
  WorkflowGroup,
  WorkflowSingular,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function emptyPerson(fields: WorkflowField[]): PersonRecord {
  return Object.fromEntries(fields.map((f) => [f.id, ""]));
}

async function copyText(value: string) {
  if (!value) {
    toast.message("Nothing to copy");
    return false;
  }
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied");
    return true;
  } catch {
    toast.error("Could not copy");
    return false;
  }
}

function CopyFieldButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="shrink-0 text-muted-foreground hover:text-foreground"
      aria-label="Copy value"
      disabled={!value}
      onClick={() => {
        void copyText(value).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
    </Button>
  );
}

export function FieldControl({
  field,
  value,
  onChange,
  optionsOverride,
  readOnly,
}: {
  field: WorkflowField;
  value: string;
  onChange: (v: string) => void;
  optionsOverride?: string[];
  readOnly?: boolean;
}) {
  const options = optionsOverride ?? field.options ?? [];

  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.id}
        value={value}
        placeholder={field.placeholder}
        required={field.required}
        rows={4}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Select
        value={value || null}
        onValueChange={(v) => onChange(v == null ? "" : String(v))}
        disabled={readOnly}
      >
        <SelectTrigger className="w-full" id={field.id}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectItem value="__empty" disabled>
              Add people above first
            </SelectItem>
          ) : (
            options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      id={field.id}
      type={field.type}
      value={value}
      placeholder={field.placeholder}
      required={field.required}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FieldsGrid({
  fields,
  values,
  onChange,
  idPrefix,
  selectOptions,
  showCopy = false,
  readOnly = false,
}: {
  fields: WorkflowField[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  idPrefix?: string;
  selectOptions?: Record<string, string[]>;
  showCopy?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.id] ?? "";
        return (
          <Field
            key={`${idPrefix ?? ""}${field.id}`}
            className={cn(field.colSpan === 2 && "sm:col-span-2")}
          >
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor={`${idPrefix ?? ""}${field.id}`}>
                {field.label}
                {field.required ? (
                  <span className="text-destructive"> *</span>
                ) : null}
              </FieldLabel>
              {showCopy ? <CopyFieldButton value={value} /> : null}
            </div>
            <FieldControl
              field={{ ...field, id: `${idPrefix ?? ""}${field.id}` }}
              value={value}
              onChange={(v) => onChange(field.id, v)}
              optionsOverride={selectOptions?.[field.id]}
              readOnly={readOnly}
            />
            {field.helperText ? (
              <FieldDescription>{field.helperText}</FieldDescription>
            ) : null}
          </Field>
        );
      })}
    </div>
  );
}

export function RepeatableGroupEditor({
  group,
  items,
  onChange,
  applicationId,
  documents,
  onDocumentUploaded,
  showCopy = false,
  readOnly = false,
  downloadOnly = false,
}: {
  group: WorkflowGroup;
  items: PersonRecord[];
  onChange: (items: PersonRecord[]) => void;
  applicationId: string;
  documents: ApplicationDocument[];
  onDocumentUploaded: (doc: ApplicationDocument) => void;
  showCopy?: boolean;
  readOnly?: boolean;
  downloadOnly?: boolean;
}) {
  function updateItem(index: number, fieldId: string, value: string) {
    const next = items.map((item, i) =>
      i === index ? { ...item, [fieldId]: value } : item,
    );
    onChange(next);
  }

  function addItem() {
    if (items.length >= group.maxItems) return;
    onChange([...items, emptyPerson(group.fields)]);
  }

  function removeItem(index: number) {
    if (items.length <= group.minItems) return;
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
            {group.label}
          </h2>
          {group.helperText ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {group.helperText}
            </p>
          ) : null}
        </div>
        {!readOnly ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={items.length >= group.maxItems}
          >
            <PlusIcon className="size-3.5" />
            {group.addLabel}
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background/50 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No {group.itemLabel.toLowerCase()}s yet.
          </p>
          {!readOnly ? (
            <Button type="button" className="mt-3" size="sm" onClick={addItem}>
              <PlusIcon className="size-3.5" />
              {group.addLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map((item, index) => (
          <article
            key={index}
            className="rounded-xl border border-border/80 bg-background p-4 sm:p-5 shadow-[0_1px_0_oklch(0_0_0/0.03)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">
                {group.itemLabel} {index + 1}
                {item.firstName || item.surname ? (
                  <span className="ml-2 font-normal text-muted-foreground">
                    — {[item.firstName, item.surname].filter(Boolean).join(" ")}
                  </span>
                ) : null}
              </h3>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={items.length <= group.minItems}
                  onClick={() => removeItem(index)}
                >
                  <Trash2Icon className="size-3.5" />
                  Remove
                </Button>
              ) : null}
            </div>

            <FieldsGrid
              fields={group.fields}
              values={item}
              idPrefix={`${group.id}-${index}-`}
              onChange={(fieldId, value) => updateItem(index, fieldId, value)}
              showCopy={showCopy}
              readOnly={readOnly}
            />

            {group.documents && group.documents.length > 0 ? (
              <div className="mt-5 border-t border-border/70 pt-4">
                <p className="mb-3 text-sm font-medium">
                  Documents for this {group.itemLabel.toLowerCase()}
                </p>
                <DocumentUploader
                  applicationId={applicationId}
                  docs={group.documents}
                  uploaded={documents}
                  ownerKey={`${group.id}:${index}`}
                  onUploaded={onDocumentUploaded}
                  downloadOnly={downloadOnly}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function SingularEditor({
  singular,
  value,
  enabled,
  onEnabledChange,
  onChange,
  applicationId,
  documents,
  onDocumentUploaded,
  showCopy = false,
  readOnly = false,
  downloadOnly = false,
}: {
  singular: WorkflowSingular;
  value: PersonRecord | null;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onChange: (value: PersonRecord | null) => void;
  applicationId: string;
  documents: ApplicationDocument[];
  onDocumentUploaded: (doc: ApplicationDocument) => void;
  showCopy?: boolean;
  readOnly?: boolean;
  downloadOnly?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
          {singular.label}
        </h2>
        {singular.helperText ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {singular.helperText}
          </p>
        ) : null}
      </div>

      {singular.optional && !readOnly ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-[var(--zoa-accent)]"
            checked={enabled}
            onChange={(e) => {
              const next = e.target.checked;
              onEnabledChange(next);
              onChange(next ? emptyPerson(singular.fields) : null);
            }}
          />
          {singular.toggleLabel ?? `Include ${singular.label.toLowerCase()}`}
        </label>
      ) : null}

      {enabled && value ? (
        <div className="rounded-xl border border-border/80 bg-background p-4 sm:p-5">
          <FieldsGrid
            fields={singular.fields}
            values={value}
            idPrefix={`${singular.id}-`}
            onChange={(fieldId, v) => onChange({ ...value, [fieldId]: v })}
            showCopy={showCopy}
            readOnly={readOnly}
          />
          {singular.documents && singular.documents.length > 0 ? (
            <div className="mt-5 border-t border-border/70 pt-4">
              <DocumentUploader
                applicationId={applicationId}
                docs={singular.documents}
                uploaded={documents}
                ownerKey={singular.id}
                onUploaded={onDocumentUploaded}
                downloadOnly={downloadOnly}
              />
            </div>
          ) : null}
        </div>
      ) : singular.optional && readOnly && !enabled ? (
        <p className="text-sm text-muted-foreground italic">Not provided</p>
      ) : null}
    </section>
  );
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export { emptyPerson, FieldGroup };
