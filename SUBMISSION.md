# Submission — Ajaia Docs

**Live app:** _<LIVE_URL>_
**Source:** https://github.com/adanramzan/docs-sharing-ajaia-assessment
**Video walkthrough:** see `VIDEO_URL.txt`

## Test accounts (mocked login: pick one on the login screen)

| Name | Email |
|---|---|
| Alice Chen | alice@ajaia.test |
| Bob Patel | bob@ajaia.test |
| Carol Diaz | carol@ajaia.test |

**2-minute review path:** log in as Alice → **+ New document** → type and format → rename → refresh (persists) → import a `.md`/`.docx` → in **Sharing** enter `bob@ajaia.test`, *Can view* → **Switch user** → Bob → doc is under **Shared with me** and opens read-only → back as Alice, change Bob to *Can edit*.

## What's included

| File / folder | Contents |
|---|---|
| `src/` | Next.js 16 app: UI, server actions, data layer (`src/lib/`) |
| `tests/docs.test.ts` | 6 automated tests: access control, sharing roles, file import |
| `README.md` | Local setup, run, test, deploy instructions |
| `PLAN.md` | Build plan from kickoff: scope, stack, data/access model, milestones, plan vs. actual |
| `PROGRESS.md` | Milestone status, manual + automated test log, bugs found |
| `docs/DEPLOY.md` | Exact Vercel + Neon setup |
| `CLAUDE.md` | Guardrails given to AI agents working in the repo |
| `ARCHITECTURE.md` | Architecture note: priorities, decisions, tradeoffs, next steps |
| `AI_WORKFLOW.md` | AI workflow note: tools, speed-ups, what was changed/rejected, verification |
| `SUBMISSION.md` | This file |
| `VIDEO_URL.txt` | Walkthrough video link |
| `PRODUCT.md`, `SCREENS.md` | Product context and screen brief used for the design pass |
| `ASSIGNMENT.md` | Requirements checklist used to track scope |

No screenshots included: the live URL needs no setup.

## Status

**Working end to end** (verified in the browser against the production database)
- Create, rename, edit, autosave, reopen; formatting persists (bold, italic, underline, H1–H3, lists, undo/redo)
- Import `.txt` / `.md` / `.docx` (≤4MB) into a new editable doc; unsupported files show a clear error
- Sharing by email with *Can view* / *Can edit*; change role; revoke; owner-only delete
- *My documents* vs *Shared with me*; viewer mode is read-only; "Document not available" for no access
- Validation and error messages (unknown email, empty title, bad file, failed save with retry)

**Deliberately not built**
- Real-time co-editing and presence (concurrent edits are last-write-wins)
- Real authentication (seeded users + "Switch user")
- Comments, version history, export

**Next 2–4 hours**
1. Optimistic concurrency on save (reject stale writes, prompt to reload)
2. Real auth (Auth.js magic link) replacing the user picker
3. Version history with restore
4. Export to Markdown/PDF; Playwright test for the share → switch user → read-only flow

## Notes for the reviewer

- Use two browser profiles (or Switch user) to see both sides of sharing.
- The live demo uses one shared database, so documents created by other reviewers may appear under the seeded accounts.
- If a page looks stale after switching users, refresh: auth is a simple cookie, by design.
