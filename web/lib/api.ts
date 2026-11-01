import {
  ensureFreshSession,
  forceLogout,
  refreshSession,
} from "./auth";
import type {
  Application,
  FormDataMap,
  WorkflowDefinition,
  WorkflowSlug,
  WorkflowSummary,
  ApplicationDocument,
} from "./types";

function apiBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart the dev server.",
    );
  }
  return url;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function sessionExpiredError() {
  return new ApiError("Session expired. Please sign in again.", 401);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (auth) {
    const session = await ensureFreshSession();
    if (!session?.idToken) {
      // ensureFreshSession already forceLogout'd when tokens were unrecoverable
      throw sessionExpiredError();
    }
    headers.set("Authorization", `Bearer ${session.idToken}`);
  }

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Failed to reach the API. Check NEXT_PUBLIC_API_URL and that CORS allows this origin.",
      0,
    );
  }

  // One retry after forced refresh on unauthorized
  if (auth && res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed?.idToken) {
      headers.set("Authorization", `Bearer ${refreshed.idToken}`);
      try {
        res = await fetch(`${apiBaseUrl()}${path}`, {
          ...options,
          headers,
        });
      } catch {
        throw new ApiError(
          "Failed to reach the API. Check NEXT_PUBLIC_API_URL and that CORS allows this origin.",
          0,
        );
      }
    } else {
      // refreshSession already forceLogout'd
      throw sessionExpiredError();
    }
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!res.ok) {
    if (res.status === 401) {
      forceLogout("session_expired");
    }
    throw new ApiError(data.error ?? res.statusText, res.status);
  }
  return data as T;
}

export const api = {
  listWorkflows: () =>
    request<{ workflows: WorkflowSummary[] }>("/workflows", {}, false),

  getWorkflow: (slug: string) =>
    request<{ workflow: WorkflowDefinition }>(`/workflows/${slug}`, {}, false),

  listApplications: () =>
    request<{ applications: Application[] }>("/applications"),

  createApplication: (workflowSlug: WorkflowSlug, formData: FormDataMap = {}) =>
    request<{ application: Application; workflow: WorkflowDefinition }>(
      "/applications",
      {
        method: "POST",
        body: JSON.stringify({ workflowSlug, formData }),
      },
    ),

  getApplication: (id: string) =>
    request<{ application: Application; workflow: WorkflowDefinition }>(
      `/applications/${id}`,
    ),

  updateApplication: (
    id: string,
    body: { formData?: FormDataMap; status?: Application["status"] },
  ) =>
    request<{ application: Application }>(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  createUploadUrl: (
    applicationId: string,
    body: {
      documentType: string;
      fileName: string;
      contentType: string;
      size: number;
      ownerKey?: string;
    },
  ) =>
    request<{ uploadUrl: string; document: ApplicationDocument }>(
      `/applications/${applicationId}/documents/upload-url`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  createDownloadUrl: (applicationId: string, documentId: string) =>
    request<{ downloadUrl: string; document: ApplicationDocument }>(
      `/applications/${applicationId}/documents/${documentId}/download-url`,
    ),

  adminListApplications: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<{ applications: Application[] }>(
      `/admin/applications${qs}`,
    );
  },

  adminGetApplication: (id: string) =>
    request<{ application: Application; workflow: WorkflowDefinition }>(
      `/admin/applications/${id}`,
    ),

  adminUpdateApplication: (
    id: string,
    body: {
      status: Exclude<Application["status"], "draft">;
      adminNote?: string;
    },
  ) =>
    request<{ application: Application }>(`/admin/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export { getSession } from "./auth";
