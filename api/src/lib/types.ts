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
  | "scuml-registration";

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
  /** When true, renders multiple fixed named fields (option1, option2…) as a group */
  maxLength?: number;
  colSpan?: 1 | 2;
}

export interface WorkflowDocument {
  id: string;
  label: string;
  description: string;
  accept: string;
  required: boolean;
}

/** Repeatable person/entity block e.g. Directors, Shareholders, Trustees */
export interface WorkflowGroup {
  id: string;
  label: string;
  itemLabel: string;
  addLabel: string;
  helperText?: string;
  minItems: number;
  maxItems: number;
  fields: WorkflowField[];
  /** Documents collected per group item (ID, signature, etc.) */
  documents?: WorkflowDocument[];
}

/** Optional single person block e.g. company secretary */
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

export interface ApplicationDocument {
  id: string;
  documentType: string;
  /** When set, document belongs to a group item (shareholders[0], directors[2], etc.) */
  ownerKey?: string;
  fileName: string;
  contentType: string;
  size: number;
  s3Key: string;
  uploadedAt: string;
  status: "pending" | "uploaded" | "error";
}

export type FormValue = string | string[] | PersonRecord[] | PersonRecord | null;
export type PersonRecord = Record<string, string>;
export type FormData = Record<string, FormValue>;

export interface Application {
  id: string;
  userId: string;
  workflowSlug: WorkflowSlug;
  status: ApplicationStatus;
  formData: FormData;
  documents: ApplicationDocument[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export function userPk(userId: string) {
  return `USER#${userId}`;
}

export function applicationSk(applicationId: string) {
  return `APP#${applicationId}`;
}

export function workflowGsi1pk(slug: string) {
  return `WORKFLOW#${slug}`;
}

export const PERSON_FIELDS: WorkflowField[] = [
  { id: "surname", label: "Surname", type: "text", required: true },
  { id: "firstName", label: "First name", type: "text", required: true },
  { id: "otherName", label: "Other name", type: "text" },
  { id: "dateOfBirth", label: "Date of birth", type: "date", required: true },
  {
    id: "gender",
    label: "Gender",
    type: "select",
    required: true,
    options: ["Male", "Female", "Other"],
  },
  {
    id: "nationality",
    label: "Nationality",
    type: "text",
    required: true,
    placeholder: "Nigerian",
  },
  { id: "phone", label: "Phone number", type: "tel", required: true },
  { id: "email", label: "Email", type: "email", required: true },
  { id: "occupation", label: "Occupation", type: "text", required: true },
  {
    id: "address",
    label: "Residential address",
    type: "textarea",
    required: true,
    colSpan: 2,
  },
  {
    id: "meansOfId",
    label: "Means of identification",
    type: "select",
    required: true,
    options: [
      "National Identification Number (NIN)",
      "International Passport",
      "Driver's Licence",
      "Voter's Card",
    ],
  },
  {
    id: "idNumber",
    label: "Identification number",
    type: "text",
    required: true,
  },
];

export const PERSON_DOCUMENTS: WorkflowDocument[] = [
  {
    id: "means-of-id",
    label: "Means of identification",
    description: "Clear copy of the selected ID document",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
  },
  {
    id: "specimen-signature",
    label: "Specimen signature",
    description: "Signed specimen on plain white paper",
    accept: ".pdf,.jpg,.jpeg,.png",
    required: true,
  },
];
