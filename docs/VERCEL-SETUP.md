# Vercel: prod (theta) + dev (second project)

AWS already has **prod** and **dev** APIs and Cognito pools. The web app needs **two Vercel projects** (or one project plus Preview env — see bottom) so each branch talks to the right backend.

## Recommended: two projects

| Vercel project | Git **production branch** | URL | Env → backend |
|----------------|---------------------------|-----|----------------|
| **theta** (existing) | `main` | https://zoa-theta.vercel.app | **prod** API + Cognito |
| **zoa-dev** (create) | `dev` | https://zoa-dev.vercel.app | **dev** API + Cognito |

### 1. Fix theta (prod) — if not done already

1. [Vercel Dashboard](https://vercel.com) → project **theta** (or whatever hosts `zoa-theta.vercel.app`).
2. **Settings → Git** → **Production Branch** = `main`.
3. **Settings → Environment Variables** → scope **Production** only:

   ```
   NEXT_PUBLIC_API_URL=https://uhe9k1a6t5.execute-api.us-east-1.amazonaws.com
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_wOS1H6CvG
   NEXT_PUBLIC_COGNITO_CLIENT_ID=23cb2sc86kg65gpdvekksg91l1
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_APP_ENV=production
   ```

4. **Deployments** → redeploy latest **Production** deployment.

### 2. Create **zoa-dev** project

1. **Add New… → Project** → import repo **`Valentine-Efagene/zoa-backend`** (same repo as theta).
2. **Root Directory** = `web` (monorepo).
3. **Project name** = `zoa-dev` (or similar).
4. Before first deploy: **Settings → Git** → **Production Branch** = `dev`  
   (This project’s “Production” URL will track the `dev` branch, not `main`.)
5. **Environment Variables** → add for **Production** (this project’s prod = `dev` branch):

   ```
   NEXT_PUBLIC_API_URL=https://jtxjwnw6w3.execute-api.us-east-1.amazonaws.com
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_SBHMsacSo
   NEXT_PUBLIC_COGNITO_CLIENT_ID=2b2dji6ivplc1q7ea3ke4gcccu
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_APP_ENV=development
   ```

6. Deploy (push to `dev` or **Redeploy** from dashboard).
7. **Settings → Domains** → assign **`zoa-dev.vercel.app`** to this project (not theta).

Cognito **dev** pool already allows `https://zoa-dev.vercel.app` in callback/logout URLs (CDK `ZoaAuth-dev`). API **dev** CORS allows that origin (`.github/env/dev.env`).

### 3. Verify

| URL | Sign-in | Data |
|-----|---------|------|
| https://zoa-theta.vercel.app | prod pool | prod DynamoDB |
| https://zoa-dev.vercel.app | dev pool | dev DynamoDB |

Use separate test accounts on dev; prod has real customers/admins.

---

## Alternative: one Vercel project only

You can keep **theta** and set **Preview** env vars to dev API/Cognito for the `dev` branch. Downsides:

- Preview URL is often `*-git-dev-*.vercel.app`, not `zoa-dev.vercel.app`.
- You must add that preview URL to **Cognito dev** callbacks and **API dev** `CORS_ORIGIN` (CDK + redeploy auth/API).

Two projects with a fixed `zoa-dev.vercel.app` domain is simpler and matches [ENVIRONMENTS.md](./ENVIRONMENTS.md).

---

## CLI (optional)

From repo root, after `npx vercel login`:

```bash
cd web
# Link dev project (second link — use different project name in prompts)
vercel link
vercel env add NEXT_PUBLIC_API_URL production   # paste dev API URL
# … other NEXT_PUBLIC_* vars
git push origin dev
```

Use **Production** env in the `zoa-dev` Vercel project because its production branch is `dev`.
