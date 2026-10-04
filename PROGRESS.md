# Progress

> Status of each milestone from [`PLAN.md`](./PLAN.md), and a log of what was actually tested and how. Browser checks were driven by Claude Code in Chrome against a production build (`npm run build && npm start`).

## Milestone status

| # | Milestone | Status | Verified by | Notes |
|---|---|---|---|---|
| 1 | Scaffold, schema, seed users, data layer | ✅ Done | Unit tests | Read the Next.js 16 upgrade guide first (async `cookies()`/`params`) |
| 2 | Dashboard, create, import, login picker | ✅ Done | Browser | |
| 3 | Editor, toolbar, autosave, rename, share panel | ✅ Done | Browser | |
| 4 | Tests + build + walkthrough | ✅ Done | 6/6 tests vs Neon; tsc, eslint, build clean | Found and fixed two bugs (below) |
| 5 | GitHub + Vercel + Neon | ✅ Done | Vercel logs | First deploy errored with `DATABASE_URL is not set` until the DB was connected and redeployed |
| 6 | Docs | ✅ Done | — | README, PLAN, ARCHITECTURE, AI_WORKFLOW, SUBMISSION, PROGRESS |
| — | UI design (parallel track) | ✅ Done | Browser | Subagent → `SCREENS.md` → Claude Design → merged as restyle only |
| — | Impeccable critique + fixes | ✅ Done | tsc, eslint, 6/6 tests | Critique in `.impeccable/critique/`; P1 fixes applied. Browser re-check pending |
| — | Sign-up (email + password) | ✅ Done | 10/10 tests (`tests/users.test.ts`), tsc, eslint, build; browser: sign up, wrong password, duplicate email (any case), sign in | Scrypt hashing, no password reset yet. Seeded demo users remain one-click. 375px not re-checked (macOS min window width) |
| — | Import fidelity: tables, task lists, links, images, H4–H6 | ✅ Done | Unit test with `tests/fixtures/all-formatting.md`; browser import of the fixture and `PLAN.md` | Found by user: Markdown tables were flattened into one paragraph. Added Tiptap table/task-list/image extensions, re-enabled links |
| 7 | Walkthrough video | ⏳ Pending | — | |
| — | Live-site click-through | ⏳ Pending | — | |
| — | Stretch: export to Markdown | ⛔ Skipped | — | Core, deploy and docs first |

## Test log

### Automated (`npm test`, against Neon)
- [x] Owner sees the doc; a stranger can't read or edit it
- [x] Viewer can read but not edit or reshare
- [x] Upgrading to editor allows edits; formatting (`<h1>`, `<strong>`) persists
- [x] Unknown email and sharing with yourself are rejected; revoking removes access
- [x] Markdown import produces headings/lists; `.txt` import escapes `<script>`
- [x] Unsupported (`.pdf`) and empty files are rejected

### Browser: editing and persistence
- [x] Log in via seeded account
- [x] **+ New document** opens the editor; button shows "Creating…" and disables while pending
- [x] H1, bold, bullet list via toolbar and shortcuts
- [x] Rename via title; "All changes saved" after debounce
- [x] Reload: title and content persist

### Browser: import
- [x] `.md`: heading, bold, italic, bulleted and numbered lists preserved
- [x] `.docx`: text and bold preserved (test file had no Word heading/list styles, so those came through as plain paragraphs)
- [x] `.pdf`: inline error "Unsupported file type"

### Browser: sharing
- [x] Unknown email → inline error
- [x] Share with Bob as *Can view* → Bob listed with viewer pill, "Shared." confirmation
- [x] Switch user → Bob: doc under **Shared with me** with owner + role
- [x] Bob opens doc: "View only" badge, no toolbar, "Only the owner can change sharing."
- [x] Bob opens a doc not shared with him → "Document not available"

### Browser: editorial redesign and motion
- [x] Dashboard, editor and login render in the editorial layout; title sits above the sheet; sticky toolbar still sticks
- [x] Login tabs switch without moving the rest of the page
- [x] Row loader plays when picking a demo user or opening a document; button-only loader on Share and remove

### Not verified
- [ ] 375px layout in a real browser (macOS minimum window width); checked in code only (share panel stacks below `lg`)
- [ ] Full click-through on the live Vercel URL

## Bugs found during testing

| Bug | Found by | Fix |
|---|---|---|
| Local embedded DB crashed on a fresh checkout (missing data directory) | Browser walkthrough + server log | Later removed entirely when moving to a single Neon database |
| Slow server round trip let a double-click create two documents | Browser walkthrough | `SubmitButton` disables and shows pending text while the action runs |
