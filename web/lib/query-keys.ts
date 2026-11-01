import type {
  Application,
  FormDataMap,
  WorkflowSlug,
} from "@/lib/types";

export const queryKeys = {
  workflows: {
    all: ["workflows"] as const,
    detail: (slug: string) => ["workflows", slug] as const,
  },
  applications: {
    all: ["applications"] as const,
    detail: (id: string) => ["applications", id] as const,
  },
  admin: {
    applications: (status?: string) =>
      ["admin", "applications", status ?? "all"] as const,
    detail: (id: string) => ["admin", "applications", id] as const,
  },
};

export type UpdateApplicationInput = {
  formData?: FormDataMap;
  status?: Application["status"];
};

export type CreateApplicationInput = {
  workflowSlug: WorkflowSlug;
  formData?: FormDataMap;
};
