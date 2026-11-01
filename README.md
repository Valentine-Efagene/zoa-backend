# Z.O.A Corporate Service Limited

Multi-workflow registration product for Z.O.A: guided CAC-style questionnaires, document uploads, Cognito auth, Serverless API, and CDK infra.

## Structure

```
api/                 Lambda handlers (Serverless + esbuild)
infra/aws/           CDK stacks — S3, DynamoDB, Cognito, SES mail DNS, GitHub OIDC
web/zoa/             Next.js app (Vercel)
forms/               Source questionnaires
.github/workflows/   Deploy API + infra via GitHub OIDC
```

## Production and development

| | **Production** | **Development** |
|--|--|--|
| Web | https://zoa-theta.vercel.app | https://zoa-dev.vercel.app (second Vercel project) |
| API stage | `prod` | `dev` |
| API URL | https://uhe9k1a6t5.execute-api.us-east-1.amazonaws.com | https://jtxjwnw6w3.execute-api.us-east-1.amazonaws.com |
| Cognito | `zoa-users-prod` | `zoa-users-dev` |

Full IDs, GitHub environment variables, and Vercel env blocks: **[docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)**.

- **Deploy prod:** `cd api && npm run deploy`
- **Deploy dev:** `cd api && npm run deploy:dev`
- **CDK:** `npx cdk deploy --all -c stage=prod|dev -c deployEmailStack=false -c createOidcProvider=false` (email DNS is a single shared `ZoaEmail-dev` stack)

Push to `main` deploys the **prod** API via GitHub Actions (`production` environment). Use workflow dispatch to deploy **dev**.

Local development uses localhost; Playwright UAT uses Floci/Mailpit (see below).

## Workflows (from `forms/`)

1. **Company limited by shares** — names, capital, shareholders & directors (add as many as needed), optional secretary, required witness (identity + structured address), per-person ID/signature uploads for shareholders/directors/secretary.
2. **Company limited by guarantee** — names ending LTD/GTE, guarantee sum, subscribers & directors, optional secretary.
3. **Incorporated trustees** — association details, constitution fields, trustees (add as needed) with origin state/LGA, per-trustee ID/NIN/passport/signature uploads, meeting days, chairman designation, optional secretary, declaration/minutes/publications attachments.
4. **SCUML registration** — organisation details, contact person, beneficial owners, directors/trustees, required supporting documents.
5. **Business name registration** — proprietor identity, home & company addresses, two proposed names, nature of business, ID/signature/passport photos.
6. **Exporters' registration certificate** — company and factory details, corporate overview, repeatable directors, export classification.
7. **Taxpromax registration** — company and location, repeatable directors, nature of business, CAC/NIN/utility uploads (OTP step on Taxpromax).
8. **Trademark registration** — proposed mark, owner and business details, optional logo and director signature.

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

Use GitHub **environments** `production` and `development` with the variable sets in [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md).

| Variable               | Notes |
| ---------------------- | ----- |
| `AWS_REGION`           | `us-east-1` |
| `AWS_DEPLOY_ROLE_ARN`  | Per-environment deploy role from `ZoaGithubOidc-{stage}` |
| `AWS_INFRA_ROLE_ARN`   | Per-environment infra role |
| `APPLICATIONS_TABLE`   | `zoa-applications-prod` or `-dev` |
| `DOCUMENTS_BUCKET`     | From `ZoaStorage-{stage}` output |
| `COGNITO_USER_POOL_ID` | From `ZoaAuth-{stage}` |
| `COGNITO_CLIENT_ID`    | From `ZoaAuth-{stage}` |
| `CORS_ORIGIN`          | Theta or zoa-dev Vercel URL |
| `APP_BASE_URL`         | Same as primary frontend for that stage |
| `EMAIL_TEMPLATES_TABLE`| `zoa-email-templates-{stage}` |
| `EMAIL_ENABLED`        | defaults to `true` |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` / `NOTIFY_ADMIN_EMAIL` | SES mail |
| `GITHUB_OWNER` / `GITHUB_REPO` | optional (`Valentine-Efagene` / `zoa-backend`) |

No long-lived `AWS_ACCESS_KEY_ID` is required — workflows assume roles via OIDC.

## 3. API

```bash
cd api
npm ci
cp .env.example .env   # fill from CDK outputs
npx serverless offline # http://localhost:4000
# or
# Deploy prod API
npx serverless deploy --stage prod
# Deploy dev API
npm run deploy:dev
```

Copy [`api/.env.example`](api/.env.example) for local env. Live deploys default **`EMAIL_ENABLED=true`** (override with GitHub variable `EMAIL_ENABLED=false` if needed). Until SES leaves sandbox, sends to unverified addresses fail silently (API does not block submissions).

## Transactional email (Amazon SES)

Cognito still sends auth mail (signup / reset). Business mail (submission confirmation, admin alert, status updates) goes through **SES** from `mail.zaynababdussalam.com`.

### 1. CDK — DNS + SES identity

Hosted zone for `zaynababdussalam.com` must be in the **same AWS account** as the stack (Route53 lookup at synth time):

```bash
cd infra/aws
npx cdk deploy ZoaEmail-dev -c stage=dev
# Skip email stack: -c deployEmailStack=false
# Other apex domain: -c emailApexDomain=example.com
```

Stack creates SES identity for `mail.<apex>`, DKIM CNAMEs, SPF on `mail`, and DMARC on `_dmarc`. Outputs include suggested `EMAIL_FROM`.

### 2. SES production access (one-time, console)

While the account is in the **SES sandbox**, mail only reaches verified addresses. After the sending domain shows **Verified**, submit [production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) (transactional filing notifications, low volume, no marketing). This step is not deployable via CDK.

### 3. Enable on the API

Defaults are already on (`EMAIL_ENABLED=true` in [`api/serverless.yml`](api/serverless.yml) and the deploy workflow). Redeploy after changing email settings. Optional GitHub variables:
- `EMAIL_FROM`, `EMAIL_REPLY_TO`, `NOTIFY_ADMIN_EMAIL`, `APP_BASE_URL`

Lambda IAM includes `ses:SendEmail` (see [`api/serverless.yml`](api/serverless.yml)).

**Local / UAT:** `EMAIL_TRANSPORT=smtp` with Mailpit (`SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025`) — see [`api/.env.uat.example`](api/.env.uat.example).

### 4. Email templates (DynamoDB)

The storage stack creates `zoa-email-templates-{stage}`. Transactional copy lives in that table (seeded from [`api/src/lib/email-template-defaults.ts`](api/src/lib/email-template-defaults.ts)): one **`layout_standard`** wrapper (logo, legal footer, site link) and six **message** bodies merged at send/preview time. Sends read from DynamoDB with in-code fallback if a row is missing. Logo URL defaults to `{APP_BASE_URL}/brand/mark.png` (hosted on the web app); override with `EMAIL_LOGO_URL` / `EMAIL_BRAND_WEBSITE` on the API Lambda.

After deploying **`ZoaStorage-{stage}`**:

```bash
cd api
npm run seed:email-templates
# overwrite after editing defaults in repo:
npm run seed:email-templates -- --force
```

Admins can preview templates at **`/admin/email-templates`** (read-only in the UI for now). API routes: `GET /admin/email-templates`, `GET /admin/email-templates/{id}`, `POST /admin/email-templates/{id}/preview`.

## 5. Web (Vercel)

```bash
cd web
npm ci
cp .env.example .env.local
npm run dev
```

Vercel env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`, `NEXT_PUBLIC_AWS_REGION`.

Without Cognito env vars, the UI uses a mock session locally (API accepts `dev-token` when Cognito is unset and `STAGE` is not `prod`). The **live** API uses real Cognito with `STAGE=dev`. Sign in with an email starting with `admin` (or password `admin`) for a local admin session.

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

## Playwright UAT (Floci)

Registration UAT runs in the browser against a local stack: **Floci** (DynamoDB + S3), **Serverless offline** API, and **Next.js**. See [`web/zoa/e2e/UAT_POLICY.md`](web/zoa/e2e/UAT_POLICY.md) — tests assert visible UI only, not workflow API responses.

```bash
docker compose -f docker-compose.uat.yml up -d   # Floci + Mailpit (password-reset UAT)
cp api/.env.uat.example api/.env.uat
cp web/zoa/.env.uat.example web/zoa/.env.uat
cd web/zoa && npm ci && npx playwright install chromium
AWS_ACCOUNT_ID=000000000000 npm run test:uat
```

CI: [`.github/workflows/uat.yml`](.github/workflows/uat.yml).
