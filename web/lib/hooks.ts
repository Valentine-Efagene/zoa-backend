"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  queryKeys,
  type CreateApplicationInput,
  type UpdateApplicationInput,
} from "@/lib/query-keys";
import type { ApplicationDocument } from "@/lib/types";

export function useWorkflows() {
  return useQuery({
    queryKey: queryKeys.workflows.all,
    queryFn: async () => {
      const res = await api.listWorkflows();
      return res.workflows;
    },
  });
}

export function useApplications() {
  return useQuery({
    queryKey: queryKeys.applications.all,
    queryFn: async () => {
      const res = await api.listApplications();
      return res.applications;
    },
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("Missing application id");
      return api.getApplication(id);
    },
    enabled: Boolean(id),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowSlug, formData = {} }: CreateApplicationInput) =>
      api.createApplication(workflowSlug, formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.applications.all,
      });
    },
  });
}

export function useUpdateApplication(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateApplicationInput) =>
      api.updateApplication(applicationId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.applications.detail(applicationId),
        (prev: { application: unknown; workflow: unknown } | undefined) =>
          prev
            ? { ...prev, application: data.application }
            : prev,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.applications.all,
      });
    },
  });
}

export function useUploadDocument(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      documentType: string;
      file: File;
      ownerKey?: string;
    }) => {
      const { uploadUrl, document } = await api.createUploadUrl(applicationId, {
        documentType: input.documentType,
        fileName: input.file.name,
        contentType: input.file.type || "application/octet-stream",
        size: input.file.size,
        ownerKey: input.ownerKey,
      });

      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": input.file.type || "application/octet-stream",
        },
        body: input.file,
      });
      if (!put.ok) throw new Error("Upload to storage failed");

      const done: ApplicationDocument = { ...document, status: "uploaded" };
      return done;
    },
    onSuccess: (doc) => {
      queryClient.setQueryData(
        queryKeys.applications.detail(applicationId),
        (
          prev:
            | {
                application: {
                  documents: ApplicationDocument[];
                  [key: string]: unknown;
                };
                workflow: unknown;
              }
            | undefined,
        ) => {
          if (!prev) return prev;
          const without = prev.application.documents.filter(
            (d) =>
              !(
                d.documentType === doc.documentType &&
                (d.ownerKey ?? "") === (doc.ownerKey ?? "")
              ),
          );
          return {
            ...prev,
            application: {
              ...prev.application,
              documents: [...without, doc],
            },
          };
        },
      );
    },
  });
}

export function useAdminApplications(status?: string) {
  return useQuery({
    queryKey: queryKeys.admin.applications(status),
    queryFn: async () => {
      const res = await api.adminListApplications(status);
      return res.applications;
    },
  });
}

export function useAdminApplication(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.detail(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("Missing application id");
      return api.adminGetApplication(id);
    },
    enabled: Boolean(id),
  });
}

export function useAdminUpdateApplication(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      status: Exclude<import("@/lib/types").Application["status"], "draft">;
      adminNote?: string;
    }) => api.adminUpdateApplication(applicationId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.admin.detail(applicationId),
        (prev: { application: unknown; workflow: unknown } | undefined) =>
          prev
            ? { ...prev, application: data.application }
            : { application: data.application, workflow: null },
      );
      void queryClient.invalidateQueries({
        queryKey: ["admin", "applications"],
      });
    },
  });
}
