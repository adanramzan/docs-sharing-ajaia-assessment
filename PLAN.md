# Build Plan — Ajaia Docs

> This records the plan agreed in the first ~15 minutes of the timebox, before any code was written. It was written up as a file after the build started. Changes made during the build are listed in **Plan vs. actual** at the end, and the git history shows the order of work.

## Goal

Ship a working slice of a Google Docs–style editor in a 4-hour timebox: documents with rich text, file import, sharing between users, persistence, a live deployment, and stakeholder-ready docs. Depth in a few areas beats shallow coverage everywhere.

## Constraints that shaped the plan

- **4 hours total**, including deploy, docs and a 3–5 min video, so roughly 2.5h of build time.
- **Reviewers must be able to test immediately**, with no payment, signup or local setup.
- **Sharing must be demonstrable**: you need at least two users and a visible owned/shared distinction.
- **Any stack is allowed.** Pick for speed and reliability, not novelty.

## Scope

| Priority | Item | Approach |
|---|---|---|
| Must | Create / rename / edit / save / reopen | Dashboard + editor page, debounced autosave with visible status |
| Must | Rich text: B/I/U, headings, lists | Tiptap StarterKit + toolbar with active states |
| Must | File upload | `.txt` / `.md` / `.docx` → new editable document (limits stated in UI) |
| Must | Sharing: owner, grant access, owned vs shared | Share by email; "My documents" / "Shared with me" |
| Must | Persistence | Postgres |
| Must | Validation, error handling, ≥1 meaningful test | zod at the action boundary; tests on access rules |
| Should | Viewer vs editor roles | Cheap on top of basic sharing; makes the model realistic |
| Stretch | Export to Markdown | Only if core is done |
| Won't | Real-time co-editing, comments, version history, real auth | Each is a project on its own; explained in docs |

## Stack decisions

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript | Frontend and backend in one codebase and one deploy |
| API | Server actions | No separate REST layer; typed end to end |
| Editor | Tiptap | Formatting, shortcuts and a content schema out of the box; the schema also strips unsafe HTML |
| Database | Postgres (Neon, via Vercel) | Vercel's filesystem is ephemeral, so SQLite would lose data. Neon is free and integrated |
| Auth | Mocked: pick a seeded user (cookie) | Allowed by the brief; real auth costs ~1h for no evaluation value |
| Hosting | Vercel + GitHub | Free, auto-deploy on push |
| Tests | Vitest | Zero config, fast |

## Data and access model

```
users(id, name, email)
documents(id, owner_id → users, title, content HTML, created_at, updated_at)
shares(doc_id → documents, user_id → users, role 'viewer'|'editor')   PK(doc_id, user_id)
```

- Role is derived per request: `owner` if `owner_id` matches, else the `shares.role`, else no access.
- **All access checks live in one module** (`src/lib/docs.ts`). Every function takes the acting user, so no page or action can skip a check.
- Owner: edit, share, revoke, delete. Editor: edit. Viewer: read only.
- Missing doc and no access look the same to the user, so document IDs aren't revealed.

## Milestones and time budget

| # | Milestone | Budget |
|---|---|---|
| 1 | Scaffold, schema, seed users, data layer with access checks | 30 min |
| 2 | Dashboard (lists, create, import) + login picker | 30 min |
| 3 | Editor page: toolbar, autosave, rename, share panel | 45 min |
| 4 | Tests (access rules + import), build, browser walkthrough | 25 min |
| 5 | Push to GitHub, deploy to Vercel, connect DB | 20 min |
| 6 | README, architecture note, AI workflow note, submission file | 30 min |
| 7 | Video | 20 min |
| — | Buffer | ~40 min |

## Testing strategy

- **Automated:** run the real SQL against Postgres. Cover: strangers can't read or edit; viewers can't edit or reshare; editors' formatted edits persist; unknown emails and self-share are rejected; revoking removes access; import escapes HTML and rejects bad files.
- **Manual / agent-driven browser pass:** login → create → format → rename → reload → import → share as viewer → switch user → read-only → upgrade to editor.
- **Gates before each push:** `tsc`, `eslint`, `next build`.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Next.js 16 breaking changes vs. older patterns | Read the bundled v16 upgrade guide before writing code |
| Concurrent edits overwrite each other | Mitigated with version-checked saves: second writer sees a reload prompt; presence shows active users so they know someone else has the doc open. |
| Upload size limits on Vercel (4.5MB body) | Cap uploads at 4MB, set the server action body limit, state it in the UI |
| Rendering imported HTML (XSS) | Only ever render through Tiptap's schema; escape `.txt` input |
| Running out of time | Core first; stretch only after deploy + docs are done |

## Deliverables

`README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, `SUBMISSION.md`, `VIDEO_URL.txt`, live URL, test accounts, and this plan.

## Plan vs. actual

| Change | Why |
|---|---|
| First build used embedded Postgres (PGlite) locally + Neon in production; **switched to one Neon database for local, tests and production** | Decision during review: one source of truth, nothing environment-specific to break. The embedded DB had also caused a crash on a fresh checkout |
| **Ran design in parallel with implementation**: a subagent wrote `SCREENS.md` from the code, Claude Design produced the UI, then it was merged as a restyle | Brief evaluates UX quality; doing it in parallel cost no build time, and restyle-only kept behavior unchanged |
| **Added an Impeccable critique pass** after deploy | Structured review (25/40, three P1s) caught issues the walkthrough didn't: overloaded red, focus ring on the editor, share form losing input on error |
| **Added pending states** to action buttons | Found in browser testing: with database latency, a double-click could create two documents |
| Fixed a dependency conflict properly (aligned `@types/node`) instead of `--legacy-peer-deps` | Would otherwise risk the Vercel install |
| **Export to Markdown + PDF** (stretch) done after the project was finalized | Small and isolated: official `@tiptap/markdown` serializer for `.md`; the browser's print-to-PDF with a print stylesheet, no PDF library |
| **Made import keep tables, task lists, links and images** | Found by importing this plan: tables were silently flattened because the editor schema lacked them |
| **Added email + password sign-up** after core, tests, deploy, and docs were done | User request; kept small with stdlib scrypt and the same session cookie. Seeded one-click logins still work. |
| **Added presence + save conflict check** (stretch) | Replaced last-write-wins, the planned "next step". A 10s heartbeat shows who else has the doc open; a version number on each save rejects stale writes with a Reload prompt instead of overwriting. Polling and a version check, not websockets/CRDT, to stay small. Tests added for both |
