# Ajaia Docs

A lightweight collaborative document editor: create, format, import, and share documents.

**Live demo:** _<add Vercel URL>_ · **Video:** see `VIDEO_URL.txt`

## Test accounts

**Sign up** with email + password (≥8 chars), or pick a seeded account on the login screen for one-click login. Use **Sign out** (top right) to change accounts.

| Name | Email |
|---|---|
| Alice Chen | alice@ajaia.test |
| Bob Patel | bob@ajaia.test |
| Carol Diaz | carol@ajaia.test |

**Try sharing:** log in as Alice → create a doc → in the Sharing panel enter `bob@ajaia.test`, choose *Can view* → Share → Sign out → Bob → the doc is under **Shared with me** and opens read-only. Change Bob to *Can edit* and he can edit.

## Features

- Create, rename, edit, and autosave documents (debounced; status shown next to the title)
- Rich text: bold, italic, underline, H1–H3, bulleted & numbered lists, undo/redo (toolbar + keyboard shortcuts)
- **File import:** `.txt`, `.md`, `.docx` (max 4MB) → new editable document. Other types are rejected with a clear message.
- **Sharing:** owner shares by email with a role (viewer / editor), can change or remove access, and can delete the doc. Dashboard separates *My documents* from *Shared with me*.
- Persistence in Postgres; formatting stored as HTML and re-validated by the editor schema on load.

## Run locally

Requires Node 20+ and a Postgres connection string (the same Neon database used by the deployment, or any free Neon/Postgres instance).

```bash
npm install
cp .env.example .env.local   # paste DATABASE_URL (Vercel → Storage → your DB → .env.local tab)
npm run dev                  # http://localhost:3000
```

Tables and seeded users are created automatically on the first request.

```bash
npm test           # vitest: sharing/access rules + file import, against the Postgres in DATABASE_URL
npm run build && npm start
```

Tests create a `[test]` document as Alice and delete it when they finish.

## Deploy (Vercel)

Import the repo in Vercel, add a Neon database from the Storage tab (sets `DATABASE_URL`), redeploy. Exact settings: [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Caveats

- **Mocked auth:** anyone can pick any seeded account. Fine for a demo, not for real use.
- **Last write wins:** two people editing the same doc at once can overwrite each other. No real-time sync.
- **Shared database:** the live demo and local dev use the same Neon database, so you may see documents other reviewers created.
- **`.docx` import** keeps text, bold/italic, and Word heading/list *styles*; manually formatted text (e.g. big bold font instead of "Heading 1") comes through as plain paragraphs.

## Project layout

```
src/lib/db.ts        Postgres connection, schema, seed users
src/lib/docs.ts      Document + sharing logic; all access checks live here
src/lib/import.ts    .txt/.md/.docx → HTML
src/lib/auth.ts      Mocked cookie auth
src/app/actions.ts   Server actions: input validation (zod) → lib/docs
src/app/page.tsx     Login picker + dashboard
src/app/docs/[id]/   Editor (Tiptap), sharing panel
tests/docs.test.ts   Automated tests
```

## Documents

| File | What it covers |
|---|---|
| [`PLAN.md`](./PLAN.md) | Kickoff plan: scope, stack, data/access model, milestones, plan vs. actual |
| [`PROGRESS.md`](./PROGRESS.md) | Milestone status, test log, bugs found during testing |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | What was prioritized and why, key decisions, next steps |
| [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) | AI tools used, what was changed or rejected, how it was verified |
| [`SUBMISSION.md`](./SUBMISSION.md) | What's included, status, test accounts |
| [`docs/DEPLOY.md`](./docs/DEPLOY.md) | Exact Vercel + Neon setup |
| [`ASSIGNMENT.md`](./ASSIGNMENT.md), [`PRODUCT.md`](./PRODUCT.md), [`SCREENS.md`](./SCREENS.md) | Requirements checklist, product context, screen brief for Claude Design |
| [`.impeccable/critique/`](./.impeccable/critique/) | Impeccable UI critique that drove the final UI fixes |
