# Ajaia Docs

A lightweight collaborative document editor: create, format, import, and share documents.

**Live demo:** https://docs-sharing-ajaia-assessment.vercel.app · **Video:** https://www.loom.com/share/403413dfd5594201928522a43ef254be

## Test accounts

Pick a demo account on the login screen (one click, no password), sign in with one of the password accounts below, or **Create account** with your own email + password (≥8 chars). Use **Sign out** (top right) to change accounts.

| Name | Email | Password |
|---|---|---|
| Alice Chen | alice@ajaia.test | — (one-click demo login) |
| Bob Patel | bob@ajaia.test | — (one-click demo login) |
| Carol Diaz | carol@ajaia.test | — (one-click demo login) |
| tester1 | test1@test.com | `test1234` |
| tester 2 | test2@test.com | `test1234` |

**Try sharing:** log in as Alice → create a doc → in the Sharing panel enter `bob@ajaia.test`, choose *Can view* → Share → Sign out → Bob → the doc is under **Shared with me** and opens read-only. Change Bob to *Can edit* and he can edit.

## Features

- Create, rename, edit, and autosave documents (debounced; status shown next to the title)
- Rich text: bold, italic, underline, H1–H3, bulleted & numbered lists, undo/redo (toolbar + keyboard shortcuts)
- **Accounts:** sign up / sign in with email + password, plus one-click demo accounts
- **File import:** `.txt`, `.md`, `.docx` (max 4MB) → new editable document. Keeps headings (H1–H6), bold/italic/strikethrough, links, lists and task lists, quotes, code, tables and images. Other types are rejected with a clear message.
- **Sharing:** owner shares by email with a role (viewer / editor), can change or remove access, and can delete the doc. Dashboard separates *My documents* from *Shared with me*.
- **Presence:** other people who have the document open appear as initials ("Also here:") next to the title, refreshed every 10s
- **Save conflict check:** if someone else saved since you loaded the document, your save is rejected instead of overwriting theirs, and you get a Reload prompt
- **Export:** "Download .md" (Markdown with tables and task lists) and "Export PDF" (browser print dialog; prints just the title and document)
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
npm test           # vitest: sharing/access rules, save conflicts, presence, sign-up, file import — against the Postgres in DATABASE_URL
npm run build && npm start
```

Tests create `[test]` documents and a temporary user, and delete them when they finish.

## Deploy (Vercel)

Import the repo in Vercel, add a Neon database from the Storage tab (sets `DATABASE_URL`), redeploy. Exact settings: [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Caveats

- **Demo-grade auth:** the seeded accounts are one-click by design, so anyone can use them. Signed-up accounts use scrypt-hashed passwords, but the session cookie is unsigned and there's no password reset, email verification or rate limiting. Fine for a demo, not for real use.
- **No live co-editing:** edits are not merged. If two people edit the same document, whoever saves second gets a Reload prompt and has to redo their change. Presence is polled every 10s, so it can lag by that much.
- **Shared database:** the live demo and local dev use the same Neon database, so you may see documents other reviewers created.
- **`.docx` import** keeps text, bold/italic, and Word heading/list *styles*; manually formatted text (e.g. big bold font instead of "Heading 1") comes through as plain paragraphs. Embedded images are kept, but they make the document large: a document over 2MB can't be saved after editing.
- **Timestamps** in the document list are formatted on the server, so the live demo shows them in UTC.

## Project layout

```
src/lib/db.ts        Postgres connection, schema, seed users
src/lib/docs.ts      Document + sharing logic; all access checks live here
src/lib/import.ts    .txt/.md/.docx → HTML
src/lib/users.ts     Sign-up / sign-in (scrypt password hashing)
src/lib/auth.ts      Cookie session: current user
src/app/actions.ts   Server actions: input validation (zod) → lib/docs
src/app/page.tsx     Login (demo accounts + sign-in/sign-up form) + dashboard
src/app/docs/[id]/   Editor (Tiptap), presence, sharing panel
tests/               Automated tests (access rules, sharing, import, conflicts, presence, sign-up) + fixtures
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
