# Deploy (Vercel + Neon)

The exact settings used for the live deployment. Everything is on free tiers.

## 1. Import the repo
Vercel → **Add New → Project** → import `docs-sharing-ajaia-assessment`. Preset **Next.js**, root `./`, no build overrides, no env vars yet. The first deploy builds fine but every page errors with `DATABASE_URL is not set` until step 2.

## 2. Add the database
Project → **Storage → Create Database → Neon (Serverless Postgres)**.

| Setting | Value | Why |
|---|---|---|
| Region | Washington, D.C. (US East) | Close to Vercel's default function region |
| Auth | **Off** | The app uses mocked auth; Neon Auth isn't needed |
| Plan | Free | |
| Environments | Production, Preview, Development | Same DB everywhere (one database by design) |
| Create database branch for deployment | **Unchecked** (both) | Branches would create separate copies of the data |
| Custom prefix | **Empty** | Keeps the variable named `DATABASE_URL`, which the app reads |
| Sensitive | **Off** | Lets you copy the value into `.env.local` for local dev and tests |

## 3. Redeploy
**Deployments → ⋯ → Redeploy**. Env vars apply to new deployments only. Tables and seed users are created automatically on the first request.

## 4. Local dev against the same database
Storage → your DB → **.env.local** tab → copy into `.env.local` at the repo root (git-ignored). Then `npm run dev` / `npm test`.
