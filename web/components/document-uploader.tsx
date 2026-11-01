"use client";

import {
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useUploadDocument } from "@/lib/hooks";
import type { ApplicationDocument, WorkflowDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ contentType }: { contentType?: string }) {
  if (!contentType) return <UploadIcon />;
  if (contentType.startsWith("image/")) return <ImageIcon />;
  if (contentType.includes("pdf")) return <FileTextIcon />;
  return <FileIcon />;
}

interface DocumentUploaderProps {
  applicationId: string;
  docs: WorkflowDocument[];
  uploaded: ApplicationDocument[];
  ownerKey?: string;
  onUploaded: (doc: ApplicationDocument) => void;
  className?: string;
  /** Admin review: download only (no upload/replace) */
  downloadOnly?: boolean;
}

export function DocumentUploader({
  applicationId,
  docs,
  uploaded,
  ownerKey,
  onUploaded,
  className,
  downloadOnly = false,
}: DocumentUploaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {docs.map((spec) => {
        const existing = uploaded.find(
          (d) =>
            d.documentType === spec.id &&
            (d.ownerKey ?? "") === (ownerKey ?? ""),
        );
        return (
          <SingleDocumentUpload
            key={`${ownerKey ?? "root"}-${spec.id}`}
            applicationId={applicationId}
            spec={spec}
            existing={existing}
            ownerKey={ownerKey}
            onUploaded={onUploaded}
            downloadOnly={downloadOnly}
          />
        );
      })}
    </div>
  );
}

function SingleDocumentUpload({
  applicationId,
  spec,
  existing,
  ownerKey,
  onUploaded,
  downloadOnly,
}: {
  applicationId: string;
  spec: WorkflowDocument;
  existing?: ApplicationDocument;
  ownerKey?: string;
  onUploaded: (doc: ApplicationDocument) => void;
  downloadOnly: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument(applicationId);
  const [local, setLocal] = useState<ApplicationDocument | undefined>(existing);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloading, setDownloading] = useState(false);

  const state = upload.isPending
    ? "uploading"
    : errorMessage
      ? "error"
      : local
        ? "done"
        : "idle";

  function handleFile(file: File) {
    setErrorMessage("");
    upload.mutate(
      { documentType: spec.id, file, ownerKey },
      {
        onSuccess: (done) => {
          setLocal(done);
          onUploaded(done);
          toast.success(`${file.name} uploaded`);
        },
        onError: (err) => {
          setErrorMessage(
            err instanceof Error ? err.message : "Upload failed",
          );
          toast.error("Upload failed");
        },
      },
    );
  }

  async function handleDownload() {
    if (!local?.id) return;
    setDownloading(true);
    try {
      const { downloadUrl } = await api.createDownloadUrl(
        applicationId,
        local.id,
      );
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not download file",
      );
    } finally {
      setDownloading(false);
    }
  }

  const attachmentState =
    state === "uploading"
      ? "uploading"
      : state === "error"
        ? "error"
        : local
          ? "done"
          : "idle";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          {spec.label}
          {spec.required ? (
            <span className="text-destructive"> *</span>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          {local && downloadOnly ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={downloading}
              onClick={() => void handleDownload()}
            >
              <DownloadIcon className="size-3" />
              {downloading ? "Preparing…" : "Download"}
            </Button>
          ) : null}
          {!local && !downloadOnly ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon className="size-3" />
              Choose file
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{spec.description}</p>

      {!downloadOnly ? (
        <input
          ref={inputRef}
          type="file"
          accept={spec.accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      ) : null}

      {(local || state === "uploading" || state === "error") && (
        <Attachment state={attachmentState} className="w-full max-w-md">
          <AttachmentMedia>
            <FileTypeIcon contentType={local?.contentType} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>
              {local?.fileName ?? "Uploading file…"}
            </AttachmentTitle>
            <AttachmentDescription>
              {state === "uploading"
                ? "Uploading…"
                : state === "error"
                  ? errorMessage || "Upload failed. Try again."
                  : local
                    ? `${local.contentType.split("/").pop()?.toUpperCase()} · ${formatSize(local.size)}`
                    : "Ready to upload"}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            {local && !downloadOnly ? (
              <AttachmentAction
                aria-label={`Replace ${local.fileName}`}
                onClick={() => inputRef.current?.click()}
              >
                <UploadIcon />
              </AttachmentAction>
            ) : null}
            {local && downloadOnly ? (
              <AttachmentAction
                aria-label={`Download ${local.fileName}`}
                disabled={downloading}
                onClick={() => void handleDownload()}
              >
                <DownloadIcon />
              </AttachmentAction>
            ) : null}
            {state === "error" ? (
              <AttachmentAction
                aria-label="Dismiss error"
                onClick={() => setErrorMessage("")}
              >
                <XIcon />
              </AttachmentAction>
            ) : null}
          </AttachmentActions>
        </Attachment>
      )}

      {downloadOnly && !local ? (
        <p className="text-xs text-muted-foreground italic">Not uploaded</p>
      ) : null}
    </div>
  );
}
