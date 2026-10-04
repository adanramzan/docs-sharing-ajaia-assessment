@AGENTS.md

# Project guardrails (for AI agents working in this repo)

Context: a 4-hour take-home. Full plan in `PLAN.md`, status in `PROGRESS.md`.

## Hard constraints
- One Postgres database (`DATABASE_URL`) for local, tests, and production. Don't add a second store.
- Reviewers must be able to test without paying, signing up, or running anything.
- All document access checks go through `src/lib/docs.ts`. Pages and actions never query documents directly.
- Validate inputs in `src/app/actions.ts` (zod) before calling `lib/docs`.
- Render document HTML only through Tiptap, never via `dangerouslySetInnerHTML`.

## Don't cut
Create/rename/edit/save, B/I/U/headings/lists, file import, sharing with owned vs shared lists, persistence, tests, deploy, docs.

## Out of scope
Real-time co-editing, comments, version history, real auth. Prefer a smaller, working slice and explain the cut.

## Working style
- Before writing Next.js code, check `node_modules/next/dist/docs/` (v16 has breaking changes).
- Run `npx tsc --noEmit && npx eslint src tests && npm test && npm run build` before committing.
- Verify UI changes in a browser, not just by type-checking.
- Update `PROGRESS.md` when a milestone or verification changes.
