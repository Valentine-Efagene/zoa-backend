# Z.O.A Corporate Service Limited

Multi-workflow registration product for Z.O.A: guided CAC-style questionnaires, document uploads, Cognito auth, Serverless API, and CDK infra.

## Structure

```
api/                 Lambda handlers (Serverless + esbuild)
infra/aws/           CDK stacks — S3, DynamoDB, Cognito, GitHub OIDC
web/zoa/             Next.js app (Vercel)
forms/               Source questionnaires
.github/workflows/   Deploy API + infra via GitHub OIDC
```

## Workflows (from `forms/`)

1. **Company limited by shares** — names, capital, shareholders & directors (add as many as needed), optional secretary, required witness (identity + structured address), per-person ID/signature uploads for shareholders/directors/secretary.
2. **Company limited by guarantee** — names ending LTD/GTE, guarantee sum, subscribers & directors, optional secretary.
3. **Incorporated trustees** — association details, constitution fields, trustees (add as needed), chairman designation, optional secretary.
4. **SCUML registration** — organisation details, contact person, beneficial owners, directors/trustees, required supporting documents.
5. **Business name registration** — proprietor identity, home & company addresses, two proposed names, nature of business, ID/signature/passport photos.

Repeatable people use **Add director / Add shareholder / Add subscriber / Add trustee** instead of fixed Director1…Director4 slots.

## 1. Deploy infra (local, once)

```bash
cd infra/aws
npm ci
npx cdk bootstrap
npx cdk deploy --all \
  -c stage=dev \
  -c githubOwner=YOUR_GITHUB_ORG \
  -c githubRepo=zoa
  -c createOidcProvider=false
```

Outputs: documents bucket, applications table, Cognito IDs, **API deploy role ARN**, **infra deploy role ARN**.

If the account already has a GitHub OIDC provider:

```bash
npx cdk deploy --all -c stage=dev -c createOidcProvider=false -c githubOwner=... -c githubRepo=...
```

**DynamoDB note:** AWS allows only one GSI create/delete per table update. New indexes are added across deploys (`gsi-admin` first, then `gsi-by-id`). If a deploy fails with “more than one GSI creation”, keep a single new GSI in `storage-stack.ts`, re-deploy, then add the next.
## 2. GitHub Actions (OIDC)

Repo **variables** (Settings → Secrets and variables → Actions → Variables):

| Variable               | Value                          |
| ---------------------- | ------------------------------ |
| `AWS_REGION`           | `us-east-1` (match CDK deploy) |
| `AWS_DEPLOY_ROLE_ARN`  | Api deploy role ARN from CDK   |
| `AWS_INFRA_ROLE_ARN`   | Infra deploy role ARN from CDK |
| `APPLICATIONS_TABLE`   | e.g. `zoa-applications-dev`    |
| `DOCUMENTS_BUCKET`     | bucket name from stack output  |
| `COGNITO_USER_POOL_ID` | user pool id                   |
| `COGNITO_CLIENT_ID`    | app client id                  |
| `CORS_ORIGIN`          | Vercel app URL                 |
| `GITHUB_OWNER`         | optional override              |
| `GITHUB_REPO`          | optional override              |

No long-lived `AWS_ACCESS_KEY_ID` is required — workflows assume roles via OIDC.

## 3. API

```bash
cd api
npm ci
cp .env.example .env   # fill from CDK outputs
npx serverless offline # http://localhost:4000
# or
npx serverless deploy --stage dev
```

## 4. Web (Vercel)

```bash
cd web/zoa
npm ci
cp .env.example .env.local
npm run dev
```

Vercel env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`, `NEXT_PUBLIC_AWS_REGION`.

Without Cognito env vars, the UI uses a mock session so forms can be exercised locally (API accepts `dev-token` when Cognito is unset and stage ≠ prod). Sign in with an email starting with `admin` (or password `admin`) for a local admin session.

## Roles (Cognito groups)

| Role      | Cognito group        | Capabilities                                         |
| --------- | -------------------- | ---------------------------------------------------- |
| Applicant | _(none or_ `user`_)_ | Create/edit/submit own applications                  |
| Admin     | `admin`              | `/admin` inbox, review any filing, set status + note |

Create groups are provisioned by the auth CDK stack. Promote a user:

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_XXXX \
  --username user@example.com \
  --group-name admin
```

Then sign out/in so tokens pick up `cognito:groups`. Status updates available to admins: `submitted`, `in_review`, `needs_info`, `completed`, `rejected`.

## Document UI

File attachments use [shadcn Attachment](https://ui.shadcn.com/docs/components/base/attachment) with upload states (idle → uploading → done/error) and presigned S3 PUTs from the API.
