import {
  PERSON_DOCUMENTS,
  PERSON_FIELDS,
  WITNESS_FIELDS,
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

const subscriberFields = [
  ...PERSON_FIELDS,
  {
    id: "amountGuaranteed",
    label: "Amount guaranteed (NGN)",
    type: "text" as const,
    required: true,
    placeholder: "e.g. 100,000",
    colSpan: 2 as const,
  },
];

const beneficialOwnerFields = [
  { id: "fullName", label: "Full name", type: "text" as const, required: true },
  {
    id: "dateOfBirth",
    label: "Date of birth",
    type: "date" as const,
    required: true,
  },
  {
    id: "nin",
    label: "National Identity Number (NIN)",
    type: "text" as const,
    required: true,
  },
  { id: "mobile", label: "Mobile", type: "tel" as const, required: true },
  {
    id: "address",
    label: "Address",
    type: "textarea" as const,
    required: true,
    colSpan: 2 as const,
  },
];

const scumlOfficialFields = [
  ...beneficialOwnerFields,
  {
    id: "gender",
    label: "Gender",
    type: "select" as const,
    required: true,
    options: ["Male", "Female", "Other"],
  },
  { id: "email", label: "Email", type: "email" as const, required: true },
  {
    id: "bvn",
    label: "Bank Verification Number (BVN)",
    type: "text" as const,
    required: true,
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
      {
        id: "witness",
        label: "Details of witness",
        optional: false,
        helperText:
          "Required under CAMA: witness must attest subscribers’ signatures and must not be a subscriber or shareholder.",
        fields: WITNESS_FIELDS,
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
  {
    slug: "company-limited-by-guarantee",
    name: "Company Limited by Guarantee",
    description:
      "Questionnaire for CAC incorporation of a company limited by guarantee — names, guarantee sum, subscribers, and directors.",
    estimatedDays: "5–10 business days",
    fields: [
      {
        id: "proposedName1",
        label: "Proposed name — option 1",
        type: "text",
        required: true,
        placeholder: "e.g. Acme Foundation Limited by Guarantee",
        helperText: "Must end with “Limited by Guarantee” or “LTD/GTE”.",
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
        placeholder: "i. …\nii. …\niii. …",
      },
      {
        id: "guaranteeSum",
        label: "Total proposed guarantee sum (NGN)",
        type: "text",
        required: true,
        placeholder: "100,000",
        helperText:
          "CAMA 2020: minimum guarantee sum for a private company is ₦100,000.",
      },
    ],
    groups: [
      {
        id: "subscribers",
        label: "Subscribers",
        itemLabel: "Subscriber",
        addLabel: "Add subscriber",
        helperText: "A private company may be formed by one subscriber.",
        minItems: 1,
        maxItems: 20,
        fields: subscriberFields,
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
    slug: "scuml-registration",
    name: "SCUML Registration",
    description:
      "Questionnaire for registration with the Special Control Unit Against Money Laundering (SCUML) — organisation details, beneficial owners, and directors or trustees.",
    estimatedDays: "7–14 business days",
    fields: [
      {
        id: "category",
        label: "Category",
        type: "select",
        required: true,
        options: ["Company", "IT (Incorporated Trustees)"],
      },
      {
        id: "cacRegistrationType",
        label: "CAC registration type",
        type: "select",
        required: true,
        options: ["RC", "BN", "IT"],
      },
      {
        id: "businessSector",
        label: "Business sector",
        type: "text",
        required: true,
      },
      {
        id: "mainBusinessObjectives",
        label: "Main business objectives",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "incorporationNumber",
        label: "Incorporation number",
        type: "text",
        required: true,
      },
      {
        id: "dateIncorporated",
        label: "Date incorporated",
        type: "date",
        required: true,
      },
      {
        id: "taxIdNumber",
        label: "Tax ID number",
        type: "text",
        required: true,
      },
      {
        id: "headOfficeAddress",
        label: "Head office address",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "bankName",
        label: "Bank name (director account)",
        type: "text",
        required: true,
      },
      {
        id: "bankAccountNumber",
        label: "Account number",
        type: "text",
        required: true,
      },
      {
        id: "bankAccountName",
        label: "Account name",
        type: "text",
        required: true,
      },
      {
        id: "organisationPhone",
        label: "Organisation phone number",
        type: "tel",
        required: true,
      },
      {
        id: "organisationEmail",
        label: "Organisation email",
        type: "email",
        required: true,
      },
    ],
    groups: [
      {
        id: "beneficialOwners",
        label: "Beneficial ownership",
        itemLabel: "Beneficial owner",
        addLabel: "Add beneficial owner",
        helperText:
          "Individuals with 5% or more share capital (or equivalent ownership).",
        minItems: 1,
        maxItems: 20,
        fields: beneficialOwnerFields,
      },
      {
        id: "officials",
        label: "Directors / trustees",
        itemLabel: "Official",
        addLabel: "Add director / trustee",
        helperText: "Details of each director or trustee of the organisation.",
        minItems: 1,
        maxItems: 20,
        fields: scumlOfficialFields,
      },
    ],
    singulars: [
      {
        id: "contactPerson",
        label: "Organisation contact person",
        optional: false,
        helperText: "Company director or trustee who is the primary contact.",
        fields: [
          { id: "name", label: "Name", type: "text", required: true },
          {
            id: "address",
            label: "Address",
            type: "textarea",
            required: true,
            colSpan: 2,
          },
          {
            id: "nin",
            label: "NIN",
            type: "text",
            required: true,
          },
          { id: "email", label: "Email", type: "email", required: true },
          { id: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
    documents: [
      {
        id: "certificate-of-incorporation",
        label: "Certificate of incorporation",
        description: "CAC certificate of incorporation",
        accept: ".pdf,.jpg,.jpeg,.png",
        required: true,
      },
      {
        id: "status-report",
        label: "Status report",
        description: "Current CAC status report",
        accept: ".pdf,.jpg,.jpeg,.png",
        required: true,
      },
      {
        id: "memo-or-constitution",
        label: "Memorandum of Association / Constitution",
        description: "Memorandum and articles, or constitution as applicable",
        accept: ".pdf,.jpg,.jpeg,.png",
        required: true,
      },
      {
        id: "tax-clearance",
        label: "Tax clearance certificate",
        description: "Valid tax clearance certificate",
        accept: ".pdf,.jpg,.jpeg,.png",
        required: true,
      },
      {
        id: "professional-certificate",
        label: "Professional certificate of the director",
        description: "Where applicable",
        accept: ".pdf,.jpg,.jpeg,.png",
        required: false,
      },
    ],
  },
  {
    slug: "business-name-registration",
    name: "Business Name Registration",
    description:
      "CAC business name (sole proprietor) registration — proprietor details, home and company addresses, proposed names, and identity documents.",
    estimatedDays: "3–7 business days",
    fields: [
      {
        id: "surname",
        label: "Surname",
        type: "text",
        required: true,
      },
      {
        id: "firstName",
        label: "First name",
        type: "text",
        required: true,
      },
      {
        id: "otherName",
        label: "Other name",
        type: "text",
      },
      {
        id: "dateOfBirth",
        label: "Date of birth",
        type: "date",
        required: true,
      },
      {
        id: "gender",
        label: "Gender",
        type: "select",
        required: true,
        options: ["Male", "Female", "Other"],
      },
      {
        id: "phone",
        label: "Phone number",
        type: "tel",
        required: true,
      },
      {
        id: "personalEmail",
        label: "Personal email address",
        type: "email",
        required: true,
      },
      {
        id: "homeState",
        label: "Home address — state",
        type: "text",
        required: true,
      },
      {
        id: "homeLga",
        label: "Home address — LGA",
        type: "text",
        required: true,
      },
      {
        id: "homeCity",
        label: "Home address — city / town / village",
        type: "text",
        required: true,
      },
      {
        id: "homeHouseNumber",
        label: "Home address — house number",
        type: "text",
        required: true,
      },
      {
        id: "homeStreet",
        label: "Home address — street name",
        type: "text",
        required: true,
        colSpan: 2,
      },
      {
        id: "companyState",
        label: "Company address — state",
        type: "text",
        required: true,
      },
      {
        id: "companyLga",
        label: "Company address — LGA",
        type: "text",
        required: true,
      },
      {
        id: "companyCity",
        label: "Company address — city / town / village",
        type: "text",
        required: true,
      },
      {
        id: "companyHouseNumber",
        label: "Company address — house number",
        type: "text",
        required: true,
      },
      {
        id: "companyStreet",
        label: "Company address — street name",
        type: "text",
        required: true,
        colSpan: 2,
      },
      {
        id: "companyEmail",
        label: "Company email",
        type: "email",
        required: true,
      },
      {
        id: "natureOfBusiness",
        label: "Nature of business",
        type: "textarea",
        required: true,
        colSpan: 2,
      },
      {
        id: "proposedName1",
        label: "Proposed business name — option 1",
        type: "text",
        required: true,
      },
      {
        id: "proposedName2",
        label: "Proposed business name — option 2",
        type: "text",
        required: true,
      },
    ],
    groups: [],
    documents: [
      {
        id: "means-of-id",
        label: "ID card",
        description:
          "National ID, international passport, driver’s licence, or voter’s card",
        accept: ".pdf,.jpg,.jpeg,.png",
        required: true,
      },
      {
        id: "specimen-signature",
        label: "Signature",
        description: "Clear photo or scan of your signature",
        accept: ".pdf,.jpg,.jpeg,.png",
        required: true,
      },
      {
        id: "passport-photograph",
        label: "Passport photograph",
        description: "Recent passport-size photograph",
        accept: ".jpg,.jpeg,.png",
        required: true,
      },
    ],
  },
];

export function getWorkflow(slug: string) {
  return workflows.find((w) => w.slug === slug);
}
