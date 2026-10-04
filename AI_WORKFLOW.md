# AI Workflow Note

## Tools

- **Claude Code (Claude Opus)** in the terminal: planning, scaffolding, writing code/tests/docs, running build/tests, and driving Chrome to click through the app.
- A Claude subagent produced a screen-by-screen design brief (`SCREENS.md`) from the real code (exact labels, states, error copy).
- **Claude Design** turned that brief into a visual system (tokens, Archivo type, role pills, a "Document not available" page). The design pass was applied as a restyle only: same markup and behavior, no new features.

## Where AI materially sped things up

- **Scoping in minutes:** turned the brief into a requirements checklist (`ASSIGNMENT.md`) and a stack decision before writing code.
- **Boilerplate and integration:** Next.js server actions, Tiptap toolbar, mammoth/marked import, SQL for role-aware queries.
- **Framework drift:** Next.js 16 has breaking changes (async `cookies()`/`params`, Turbopack default). The agent read the version-16 upgrade guide shipped in `node_modules/next/dist/docs` before writing code rather than relying on older patterns.
- **Verification loop:** typecheck, lint, tests, production build, and a scripted browser walkthrough (login → create → format → rename → reload → share → switch user → read-only check), all run by the agent.

## What I changed or rejected

- **Rejected SQLite on Vercel.** The first instinct was SQLite; Vercel's filesystem is ephemeral, so data would vanish. Chose a single Postgres (Neon via Vercel) for local, tests, and production.
- **Constrained the design pass.** I gave the design tool binding constraints (`PRODUCT.md`): restyle only, no new features, AA contrast, visible focus, works at 375px. Then I reviewed the diff to confirm behavior was unchanged (same server actions, same role logic) and that it added accessibility (`role="alert"`/`"status"`, `aria-invalid`, disabled undo/redo).
- **Rejected a REST API layer** in favor of server actions: less code for the same behavior.
- **Moved access checks** into one module (`lib/docs.ts`) instead of per-page checks, so they can't be forgotten.
- **Fixed a dependency conflict properly** (aligned `@types/node` with vitest's peer range) instead of shipping `--legacy-peer-deps`, which would break the Vercel install.
- **Simplified the data layer.** The AI's first version used an embedded Postgres (PGlite) locally and Neon in production for zero-setup local runs. I rejected two databases and kept one Postgres for every environment: a single source of truth and nothing environment-specific to break. (The embedded DB had already caused a crash on a fresh checkout, caught in browser testing.)
- **Removed a client import of server code:** the share panel imported the seed list from `db.ts`, which would have pulled the Postgres driver into the browser bundle; the list is passed as a prop instead.

## How I verified correctness, UX, and reliability

- `tests/docs.test.ts` (vitest, 6 tests) runs the real SQL against the app's Postgres: non-shared users can't read/edit, viewers can't edit or reshare, editors' formatted edits persist, unknown emails and self-share are rejected, revoking removes access, import escapes HTML and rejects bad files.
- `tsc`, `eslint`, and `next build` clean.
- Manual + agent-driven browser pass of every core flow in the production build, including the owner/viewer views with two accounts.
- I reviewed every generated file before committing; the code is small enough (~750 lines including tests) to read end to end.
