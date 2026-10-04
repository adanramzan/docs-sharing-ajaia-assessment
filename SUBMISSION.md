# Submission — Ajaia Docs

**Live app:** https://docs-sharing-ajaia-assessment.vercel.app
**Source:** https://github.com/adanramzan/docs-sharing-ajaia-assessment
**Video walkthrough:** see `VIDEO_URL.txt`

## Test accounts

Demo accounts log in with one click on the login screen; the password accounts use the sign-in form. You can also **Create account** with any email.

| Name | Email | Password |
|---|---|---|
| Alice Chen | alice@ajaia.test | — (one-click demo login) |
| Bob Patel | bob@ajaia.test | — (one-click demo login) |
| Carol Diaz | carol@ajaia.test | — (one-click demo login) |
| tester1 | test1@test.com | `test1234` |
| tester 2 | test2@test.com | `test1234` |

**2-minute review path:** log in as Alice → **+ New document** → type and format → rename → refresh (persists) → import a `.md`/`.docx` → in **Sharing** enter `bob@ajaia.test`, *Can view* → **Sign out** → Bob → doc is under **Shared with me** and opens read-only → back as Alice, change Bob to *Can edit*.

## What's included

| File / folder | Contents |
|---|---|
| `src/` | Next.js 16 app: UI, server actions, data layer (`src/lib/`) |
| `tests/docs.test.ts` | 9 automated tests: access control, sharing roles, file import (incl. tables and task lists), save conflicts, presence |
| `tests/users.test.ts` | 4 tests: password check after sign-up, duplicate email (any case), seeded users can't password-login, new users can receive shares |
| `tests/fixtures/all-formatting.md` | Markdown file with every supported element; used by the import test and handy for trying import |
| `README.md` | Local setup, run, test, deploy instructions |
| `PLAN.md` | Build plan from kickoff: scope, stack, data/access model, milestones, plan vs. actual |
| `PROGRESS.md` | Milestone status, manual + automated test log, bugs found |
| `docs/DEPLOY.md` | Exact Vercel + Neon setup |
| `CLAUDE.md` | Guardrails given to AI agents working in the repo |
| `ARCHITECTURE.md` | Architecture note: priorities, decisions, tradeoffs, next steps |
| `AI_WORKFLOW.md` | AI workflow note: tools, speed-ups, what was changed/rejected, verification |
| `SUBMISSION.md` | This file |
| `VIDEO_URL.txt` | Walkthrough video link |
| `PRODUCT.md`, `SCREENS.md` | Product context and screen brief used for Claude Design |
| `.impeccable/critique/` | Impeccable UI critique that drove the final UI fixes |
| `ASSIGNMENT.md` | Requirements checklist used to track scope |

No screenshots included: the live URL needs no setup.

## Status

**Working end to end** (verified in the browser against the production database)
- **Sign up** with email + password (≥8 chars) or one-click login with seeded accounts
- Create, rename, edit, autosave, reopen; formatting persists (bold, italic, underline, H1–H3, lists, undo/redo)
- Import `.txt` / `.md` / `.docx` (≤4MB) into a new editable doc, keeping headings, links, lists, task lists, quotes, code, tables and images; unsupported files show a clear error
- Sharing by email with *Can view* / *Can edit*; change role; revoke; owner-only delete
- **Export:** "Download .md" (GFM, incl. tables and task lists) and "Export PDF" (print dialog, prints only the title and document) for every role
- *My documents* vs *Shared with me* (shows owner and your access); viewer mode is read-only; "Document not available" for no access
- **Presence & save conflicts:** the title row shows who else has the document open ("Also here:" initials, refreshed every 10s). If someone else saved since you loaded the document, your save is rejected instead of overwriting theirs; you see "Someone else saved a newer version." with a Reload button, and autosave pauses so nothing is silently lost
- Validation and error messages (unknown email, empty title, bad file, failed save with retry)

**Deliberately not built**
- Real-time co-editing (edits are not merged; conflicting saves are rejected with a reload prompt)
- Production-grade auth (signed sessions, password reset, email verification)
- Comments, version history

**Known ceilings in sign-up**
- No password reset or email verification
- No session expiry; no rate limiting on login attempts
- Session cookie is unsigned; passwords stored with scrypt. Upgrade to Auth.js/Clerk for production

**Other known limits**
- Edits are not merged: whoever saves second must reload and redo their change. Presence lags by up to 10s (polling, not websockets)
- `.docx` files with many embedded images can exceed the 2MB document limit, so edits to them fail to save

**Next 2–4 hours**
1. Add password reset and email verification
2. Real auth library (Auth.js) with signed sessions and rate limiting
3. Version history with restore
4. Playwright test for the share → sign out → read-only flow

## Notes for the reviewer

- Use two browser profiles (or Sign out) to see both sides of sharing.
- To see presence and the conflict check: open the same document as Alice and Bob (editor) in two browser profiles. Within ~10s each sees the other's initials; type as Bob, then within ~10s Alice sees "Someone else saved a newer version."
- The live demo uses one shared database, so documents created by other reviewers may appear under the shared accounts.
- Times in the document list are formatted on the server, so the live demo shows UTC.
- To try import quickly, use `tests/fixtures/all-formatting.md` or any `.md` file in this repo (e.g. `PLAN.md`, which has tables).
