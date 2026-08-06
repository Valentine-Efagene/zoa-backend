import {
  PERSON_DOCUMENTS,
  PERSON_FIELDS,
  type WorkflowDefinition,
} from "./types";

const shareholdingFields = [
  ...PERSON_FIELDS,
  {
    id: "sharesSubscribed",
    label: "Total shares / % of shares subscribed",
    type: "text" as const,
    required: true,
    placeholder: "e.g. 10,000 shares (50%)",
    colSpan: 2 as const,
  },
];

export const workflows: WorkflowDefinition[] = [
  {
    slug: "company-limited-by-shares",
    name: "Company Limited by Shares",
    description:
      "Questionnaire for CAC incorporation of a private company limited by shares — names, capital, shareholders, and directors.",
    estimatedDays: "5–10 business days",
    fields: [
      {
        id: "proposedName1",
        label: "Proposed name — option 1",
        type: "text",
        required: true,
        placeholder: "e.g. Acme Ventures Limited",
      },
      {
        id: "proposedName2",
        label: "Proposed name — option 2",
        type: "text",
        required: true,
      },
      {
        id: "proposedName3",
        label: "Proposed name — option 3",
        type: "text",
        required: true,
      },
      {
        id: "registeredAddress",
        label: "Registered address of company (include LGA)",
        type: "textarea",
        required: true,
        colSpan: 2,
        placeholder: "Street, city, LGA, state",
      },
      {
        id: "principalActivity",
        label: "Description of principal activity",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "companyEmail",
        label: "Email address of proposed company",
        type: "email",
        required: true,
      },
      {
        id: "objects",
        label: "Objects / business of the company",
        type: "textarea",
        required: true,
        colSpan: 2,
        helperText: "List the main business objects (i–vi as applicable)",
        placeholder:
          "i. …\nii. …\niii. …",
      },
      {
        id: "shareCapital",
        label: "Total proposed share capital (NGN)",
        type: "text",
        required: true,
        placeholder: "1,000,000",
        helperText:
          "CAMA 2020: all share capital must be allotted. Minimum for foreign participation is ₦100,000,000.",
      },
    ],
    groups: [
      {
        id: "shareholders",
        label: "Shareholders",
        itemLabel: "Shareholder",
        addLabel: "Add shareholder",
        helperText:
          "Minimum of 1 shareholder for a private company limited by shares.",
        minItems: 1,
        maxItems: 20,
        fields: shareholdingFields,
        documents: PERSON_DOCUMENTS,
      },
      {
        id: "directors",
        label: "Directors",
        itemLabel: "Director",
        addLabel: "Add director",
        helperText:
          "A small company may have one director. Foreign directors are permitted.",
        minItems: 1,
        maxItems: 20,
        fields: PERSON_FIELDS,
        documents: PERSON_DOCUMENTS,
      },
    ],
    singulars: [
      {
        id: "secretary",
        label: "Company secretary",
        optional: true,
        toggleLabel: "Appoint a company secretary",
        helperText:
          "A small company need not appoint a secretary. The secretary may also be a company.",
        fields: PERSON_FIELDS,
        documents: PERSON_DOCUMENTS,
      },
    ],
    documents: [],
  },
  {
    slug: "incorporated-trustees",
    name: "Incorporated Trustees",
    description:
      "Questionnaire for registration of an incorporated trustees association — names, constitution, aims, and trustees.",
    estimatedDays: "7–14 business days",
    fields: [
      {
        id: "proposedName1",
        label: "Proposed name — option 1",
        type: "text",
        required: true,
      },
      {
        id: "proposedName2",
        label: "Proposed name — option 2",
        type: "text",
        required: true,
      },
      {
        id: "proposedName3",
        label: "Proposed name — option 3",
        type: "text",
        required: true,
      },
      {
        id: "associationDescription",
        label: "Description of the association",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "organisationEmail",
        label: "Email of organisation",
        type: "email",
        required: true,
      },
      {
        id: "registeredAddress",
        label: "Registered office address",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "minTrustees",
        label: "Minimum number of trustees",
        type: "text",
        required: true,
      },
      {
        id: "maxTrustees",
        label: "Maximum number of trustees",
        type: "text",
        required: true,
      },
      {
        id: "trusteeTenure",
        label: "Trustee tenure",
        type: "text",
        required: true,
        placeholder: "e.g. 3 years",
      },
      {
        id: "commonSealCustodian",
        label: "Custodian of common seal",
        type: "text",
        required: true,
      },
      {
        id: "governingBody",
        label: "Governing body",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "applicationOfFunds",
        label: "Application of funds",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "keepingAccount",
        label: "Keeping of accounts",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "aimsAndObjectives",
        label: "Aims and objectives of the association",
        type: "textarea",
        required: true,
        colSpan: 2,
        helperText: "List aims i–vi as applicable",
        placeholder: "i. …\nii. …\niii. …",
      },
      {
        id: "chairmanTrusteeIndex",
        label: "Which trustee acts as Chairman?",
        type: "select",
        required: true,
        options: [], // filled client-side from trustees list
        helperText:
          "Designate one of the trustees below as Chairman. Options update as you add trustees.",
        colSpan: 2,
      },
    ],
    groups: [
      {
        id: "trustees",
        label: "Trustees",
        itemLabel: "Trustee",
        addLabel: "Add trustee",
        helperText: "Add each trustee who will serve on the association.",
        minItems: 1,
        maxItems: 20,
        fields: PERSON_FIELDS.filter((f) => f.id !== "idNumber").concat([
          {
            id: "idNumber",
            label: "Identification number",
            type: "text",
            required: false,
          },
        ]),
        documents: [
          {
            id: "means-of-id",
            label: "Means of identification",
            description: "Clear copy of the trustee's ID",
            accept: ".pdf,.jpg,.jpeg,.png",
            required: true,
          },
        ],
      },
    ],
    singulars: [
      {
        id: "secretary",
        label: "Secretary",
        optional: true,
        toggleLabel: "Appoint a secretary (separate from trustees)",
        helperText:
          "Any listed trustee may also act as secretary. Use this section only if appointing someone else.",
        fields: PERSON_FIELDS,
        documents: [
          {
            id: "means-of-id",
            label: "Means of identification",
            description: "Clear copy of the secretary's ID",
            accept: ".pdf,.jpg,.jpeg,.png",
            required: true,
          },
        ],
      },
    ],
    documents: [
      {
        id: "foreign-certs",
        label: "Foreign registration certificates (if any)",
        description:
          "Certified copies of certificates of registration in other African jurisdictions",
        accept: ".pdf,.jpg,.jpeg,.png",
        required: false,
      },
    ],
  },
];

export function getWorkflow(slug: string) {
  return workflows.find((w) => w.slug === slug);
}
