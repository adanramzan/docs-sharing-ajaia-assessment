# AI Workflow Note

## Workflow

```
Brief ──► Claude: stack + plan ──► PLAN.md / ASSIGNMENT.md
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   Claude Code: implement plan                  Subagent: screen brief (SCREENS.md)
   milestone by milestone                                     │
              │                                               ▼
              │                                   Claude Design: UI screens
              └──────────────► merge (restyle only) ◄─────────┘
                                      │
                    Test: unit tests + Claude in Chrome walkthrough
                                      │
                    Deploy: GitHub → Vercel + Neon Postgres
                                      │
                    Impeccable: UI critique → targeted fixes
```

1. **Plan before code.** Discussed the brief with Claude to pick the stack and agree a scoped plan (`PLAN.md`), and turned the brief into a requirements checklist (`ASSIGNMENT.md`).
2. **Two tracks in parallel.** Claude Code implemented the plan milestone by milestone while a subagent wrote a screen-by-screen brief from the real code (`SCREENS.md`), which Claude Design used to design the UI.
3. **Merge.** Applied the design to the working app as a restyle only: same markup, server actions and role logic.
4. **Test.** Automated tests against the real database, then Claude in Chrome walked through every use case (create, format, reload, import, share, switch user, read-only, no access).
5. **Deploy.** GitHub → Vercel, Neon Postgres connected through the Vercel Storage tab (`docs/DEPLOY.md`).
6. **Refine UI.** Ran the Impeccable design skill for a structured critique (scored 25/40, three P1 issues; saved in `.impeccable/critique/`), then fixed the issues it found.
7. **Add sign-up** (post-core). Fanned out parallel subagents with models matched to the work: Sonnet for backend (scrypt auth, password validation) and UI (sign-up form, login flow), Haiku for documentation updates, Opus (main session) for integration and browser verification. Kept the change small: stdlib `scrypt`, same `httpOnly` session cookie, no new auth library.

## Tools

| Tool | Used for |
|---|---|
| **Claude** (chat) | Stack choice, scope, plan |
| **Claude Code** (Claude Opus) | Implementation, tests, docs, build/lint/test loop, git |
| **Claude subagent** | Screen brief for the designer, written from the actual code (labels, states, error copy) |
| **Claude Design** | Visual system and screens (tokens, Archivo type, role pills, "Document not available" page) |
| **Claude in Chrome** | Driving the real app through every use case, reading console and network logs |
| **Impeccable** (design skill) | Heuristic UI critique and targeted fixes (contrast, focus, form states, accessibility) |

## Where AI materially sped things up

- **Scoping in minutes:** turned the brief into a requirements checklist (`ASSIGNMENT.md`) and a stack decision before writing code.
- **Boilerplate and integration:** Next.js server actions, Tiptap toolbar, mammoth/marked import, SQL for role-aware queries.
- **Framework drift:** Next.js 16 has breaking changes (async `cookies()`/`params`, Turbopack default). The agent read the version-16 upgrade guide shipped in `node_modules/next/dist/docs` before writing code rather than relying on older patterns.
- **Verification loop:** typecheck, lint, tests, production build, and a scripted browser walkthrough (login → create → format → rename → reload → share → switch user → read-only check), all run by the agent.

## What I changed or rejected

- **Rejected SQLite on Vercel.** The first instinct was SQLite; Vercel's filesystem is ephemeral, so data would vanish. Chose a single Postgres (Neon via Vercel) for local, tests, and production.
- **Constrained the design pass.** I gave the design tool binding constraints (`PRODUCT.md`): restyle only, no new features, AA contrast, visible focus, works at 375px. Then I reviewed the diff to confirm behavior was unchanged (same server actions, same role logic) and that it added accessibility (`role="alert"`/`"status"`, `aria-invalid`, disabled undo/redo).
- **Acted on the Impeccable critique selectively.** Fixed its P1 issues: one red was doing primary, error *and* focus (split out a danger color and an ink focus ring), the focus ring outlined the whole writing area while typing (removed for the editor), and the share form lost the email and role on error (now kept; "remove" got a pending state). Also fixed the unlabeled role select, a missing page heading, and added an editor placeholder. Detector hits it marked as false positives were left alone.
- **Rejected a REST API layer** in favor of server actions: less code for the same behavior.
- **Moved access checks** into one module (`lib/docs.ts`) instead of per-page checks, so they can't be forgotten.
- **Fixed a dependency conflict properly** (aligned `@types/node` with vitest's peer range) instead of shipping `--legacy-peer-deps`, which would break the Vercel install.
- **Simplified the data layer.** The AI's first version used an embedded Postgres (PGlite) locally and Neon in production for zero-setup local runs. I rejected two databases and kept one Postgres for every environment: a single source of truth and nothing environment-specific to break. (The embedded DB had already caused a crash on a fresh checkout, caught in browser testing.)
- **Removed a client import of server code:** the share panel imported the seed list from `db.ts`, which would have pulled the Postgres driver into the browser bundle; the list is passed as a prop instead.

## How I verified correctness, UX, and reliability

- `tests/docs.test.ts` (vitest, 6 tests) runs the real SQL against the app's Postgres: non-shared users can't read/edit, viewers can't edit or reshare, editors' formatted edits persist, unknown emails and self-share are rejected, revoking removes access, import escapes HTML and rejects bad files.
- `tsc`, `eslint`, and `next build` clean.
- Agent-driven browser pass (Claude in Chrome) of every core flow in the production build against the real database, with two accounts for owner/viewer views. It caught two real bugs: a crash on a fresh checkout and a double-submit that could create duplicate documents. Full log in `PROGRESS.md`.
- After each design change (Claude Design merge, Impeccable fixes) I re-ran typecheck, lint and tests and reviewed the diff for behavior changes.
- I reviewed every generated file before committing; the code is small enough (~750 lines including tests) to read end to end.
