# Ajaia Docs

A lightweight collaborative document editor: create, format, import, and share documents.

**Live demo:** _<add Vercel URL>_ · **Video:** see `VIDEO_URL.txt`

## Test accounts

Auth is mocked: pick a seeded account on the login screen. Use **Switch user** (top right) to change accounts.

| Name | Email |
|---|---|
| Alice Chen | alice@ajaia.test |
| Bob Patel | bob@ajaia.test |
| Carol Diaz | carol@ajaia.test |

**Try sharing:** log in as Alice → create a doc → in the Sharing panel enter `bob@ajaia.test`, choose *Can view* → Share → Switch user → Bob → the doc is under **Shared with me** and opens read-only. Change Bob to *Can edit* and he can edit.

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

1. Import the GitHub repo in Vercel (defaults are fine).
2. Project → Storage → Create → Postgres (Neon, free). This sets `DATABASE_URL`.
3. Redeploy. Schema + seed users are created on first request.

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

See `PLAN.md` (kickoff plan and what changed), `ARCHITECTURE.md` (decisions) and `AI_WORKFLOW.md` (process).
