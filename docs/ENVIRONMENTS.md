# Environments (prod vs dev)

## Branches (GitHub + Vercel)

| Git branch | AWS stage | Vercel (suggested) | GitHub Actions environment |
|------------|-----------|--------------------|----------------------------|
| **`main`** | `prod` | **Production** → `zoa-theta.vercel.app` | `production` |
| **`dev`** | `dev` | **Preview** → `zoa-dev.vercel.app` | `development` |

- Push to **`main`** runs [Deploy API](.github/workflows/deploy-api.yml) → `zoa-api-prod`.
- Push to **`dev`** deploys `zoa-api-dev`.
- Non-secret defaults live in [`.github/env/`](.github/env/) (OIDC role ARNs, table names, CORS). Optional GitHub **environment** variables override those values.

In Vercel: set **Production Branch** = `main` on the theta project; create a second project (or branch-specific env) for **`dev`** → `zoa-dev.vercel.app`.

## Production (customer-facing)

| | |
|--|--|
| **Web** | https://zoa-theta.vercel.app |
| **API** | https://uhe9k1a6t5.execute-api.us-east-1.amazonaws.com |
| **API docs (Swagger)** | https://uhe9k1a6t5.execute-api.us-east-1.amazonaws.com/docs — HTTP Basic Auth (same `SWAGGER_USER` / `SWAGGER_PASSWORD` as qshelter monolith; GitHub repo secrets) |
| **Cognito pool** | `us-east-1_wOS1H6CvG` |
| **Cognito client** | `23cb2sc86kg65gpdvekksg91l1` |
| **Applications table** | `zoa-applications-prod` |
| **Documents bucket** | `zoa-documents-prod-898751738669` |
| **Email templates** | `zoa-email-templates-prod` |
| **Deploy** | `cd api && npm run deploy` (stage `prod`) |

### Vercel (theta project) — Production env

```
NEXT_PUBLIC_API_URL=https://uhe9k1a6t5.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_wOS1H6CvG
NEXT_PUBLIC_COGNITO_CLIENT_ID=23cb2sc86kg65gpdvekksg91l1
NEXT_PUBLIC_AWS_REGION=us-east-1
```

Redeploy theta after updating env vars.

## Development

| | |
|--|--|
| **Web** | https://zoa-dev.vercel.app (create new Vercel project, same repo, `web/` root) |
| **API** | https://jtxjwnw6w3.execute-api.us-east-1.amazonaws.com |
| **API docs (Swagger)** | https://jtxjwnw6w3.execute-api.us-east-1.amazonaws.com/docs — same Basic Auth as prod |
| **Cognito pool** | `us-east-1_SBHMsacSo` |
| **Cognito client** | `2b2dji6ivplc1q7ea3ke4gcccu` |
| **Applications table** | `zoa-applications-dev` |
| **Documents bucket** | `zoa-documents-dev-898751738669` |
| **Email templates** | `zoa-email-templates-dev` |
| **Deploy** | `cd api && npm run deploy:dev` |

### Vercel (zoa-dev project)

```
NEXT_PUBLIC_API_URL=https://jtxjwnw6w3.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_SBHMsacSo
NEXT_PUBLIC_COGNITO_CLIENT_ID=2b2dji6ivplc1q7ea3ke4gcccu
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## GitHub Actions environments

Create two environments under **Settings → Environments**: `production` and `development`.

Use the **same variable names** in each environment; values differ:

| Variable | production | development |
|----------|------------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::898751738669:role/zoa-gha-api-deploy-prod` | `arn:aws:iam::898751738669:role/zoa-gha-api-deploy-dev` |
| `AWS_INFRA_ROLE_ARN` | `arn:aws:iam::898751738669:role/zoa-gha-infra-deploy-prod` | `arn:aws:iam::898751738669:role/zoa-gha-infra-deploy-dev` |
| `APPLICATIONS_TABLE` | `zoa-applications-prod` | `zoa-applications-dev` |
| `DOCUMENTS_BUCKET` | `zoa-documents-prod-898751738669` | `zoa-documents-dev-898751738669` |
| `COGNITO_USER_POOL_ID` | `us-east-1_wOS1H6CvG` | `us-east-1_SBHMsacSo` |
| `COGNITO_CLIENT_ID` | `23cb2sc86kg65gpdvekksg91l1` | `2b2dji6ivplc1q7ea3ke4gcccu` |
| `EMAIL_TEMPLATES_TABLE` | `zoa-email-templates-prod` | `zoa-email-templates-dev` |
| `CORS_ORIGIN` | `https://zoa-theta.vercel.app` | `https://zoa-dev.vercel.app` |
| `APP_BASE_URL` | `https://zoa-theta.vercel.app` | `https://zoa-dev.vercel.app` |

Push to `main` deploys **prod** API. Push to **`dev`** deploys **dev** API.

**Swagger docs:** set repository secrets `SWAGGER_USER` and `SWAGGER_PASSWORD` (shared with qshelter API docs). Deploy bakes them into Lambda env; `/docs` and `/docs/openapi.json` require Basic Auth. Use **Authorize** in Swagger UI for Cognito Bearer tokens on API calls.

## SES

Single DNS/identity stack (`ZoaEmail-dev`). Both APIs send via `filings@mail.zaynababdussalam.com`. Do not deploy `ZoaEmail-prod`.

## Migration scripts

```bash
cd api
npm run migrate:user-to-prod -- --email customer@example.com
npm run provision:prod-admins
```
