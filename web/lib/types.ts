export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "needs_info"
  | "completed"
  | "rejected";

export type WorkflowSlug =
  | "company-limited-by-shares"
  | "company-limited-by-guarantee"
  | "incorporated-trustees"
  | "scuml-registration"
  | "business-name-registration"
  | "exporters-registration-certificate"
  | "taxpromax-registration"
  | "trademark-registration";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "select"
  | "textarea"
  | "date";

export interface WorkflowField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
  colSpan?: 1 | 2;
}

export interface WorkflowDocument {
  id: string;
  label: string;
  description: string;
  accept: string;
  required: boolean;
}

export interface WorkflowGroup {
  id: string;
  label: string;
  itemLabel: string;
  addLabel: string;
  helperText?: string;
  minItems: number;
  maxItems: number;
  fields: WorkflowField[];
  documents?: WorkflowDocument[];
}

export interface WorkflowSingular {
  id: string;
  label: string;
  helperText?: string;
  optional: boolean;
  toggleLabel?: string;
  fields: WorkflowField[];
  documents?: WorkflowDocument[];
}

export interface WorkflowDefinition {
  slug: WorkflowSlug;
  name: string;
  description: string;
  estimatedDays: string;
  fields: WorkflowField[];
  groups: WorkflowGroup[];
  singulars?: WorkflowSingular[];
  documents: WorkflowDocument[];
}

export interface WorkflowSummary {
  slug: WorkflowSlug;
  name: string;
  description: string;
  estimatedDays: string;
  fieldCount: number;
  documentCount: number;
}

export interface ApplicationDocument {
  id: string;
  documentType: string;
  ownerKey?: string;
  fileName: string;
  contentType: string;
  size: number;
  s3Key: string;
  uploadedAt: string;
  status: "pending" | "uploaded" | "error";
}

export type PersonRecord = Record<string, string>;
export type FormValue =
  | string
  | string[]
  | PersonRecord[]
  | PersonRecord
  | null;
export type FormDataMap = Record<string, FormValue>;

export interface Application {
  id: string;
  userId: string;
  workflowSlug: WorkflowSlug;
  status: ApplicationStatus;
  formData: FormDataMap;
  documents: ApplicationDocument[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  applicantEmail?: string;
  applicantName?: string;
  adminNote?: string;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  needs_info: "Needs info",
  completed: "Completed",
  rejected: "Rejected",
};
