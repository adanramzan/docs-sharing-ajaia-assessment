# Progress

> Status of each milestone from [`PLAN.md`](./PLAN.md), and a log of what was actually tested and how. Browser checks were driven by Claude Code in Chrome against a production build (`npm run build && npm start`), except the stretch features, which were checked on the dev server.

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
| — | Impeccable critique + fixes | ✅ Done | tsc, eslint, tests; browser | Critique in `.impeccable/critique/`; P1 fixes applied |
| — | Sign-up (email + password) | ✅ Done | 10/10 tests (`tests/users.test.ts`), tsc, eslint, build; browser: sign up, wrong password, duplicate email (any case), sign in | Scrypt hashing, no password reset yet. Seeded demo users remain one-click. 375px not re-checked (macOS min window width) |
| — | Import fidelity: tables, task lists, links, images, H4–H6 | ✅ Done | Unit test with `tests/fixtures/all-formatting.md`; browser import of the fixture and `PLAN.md` | Found by user: Markdown tables were flattened into one paragraph. Added Tiptap table/task-list/image extensions, re-enabled links |
| 7 | Walkthrough video | ✅ Done | — | https://www.loom.com/share/403413dfd5594201928522a43ef254be |
| — | Sign out on every page; clearer *Shared with me* labels | ✅ Done | Browser | Found by user testing: label read "Carol Diaz · editor"; now "Owner: Carol Diaz" + "Can edit" |
| — | Live-site click-through | ✅ Done | Browser on the Vercel URL | Demo login, dashboard, shared doc with tables, editor role, sign out. Password test accounts confirmed in the database |
| — | Stretch: export to Markdown + PDF | ✅ Done | tsc, eslint, 11/11 tests, build; browser: `.md` output of `PLAN.md` (headings, quote, bold, tables) | Built by one subagent after finalizing. PDF print preview not checked by the agent (the print dialog blocks browser automation) |
| — | Stretch: presence + save conflict check | ✅ Done | tsc, eslint, 13/13 tests (`docs.test.ts` now 9), build; browser (dev server, second user simulated via SQL): presence chip, conflict → Reload prompt, autosave stopped, no false conflicts | Polling heartbeat every 10s, version check on save. Two new test cases: "rejects a stale save", "presence lists other active users only, never strangers" |

## Test log

### Automated (`npm test`, against Neon)
- [x] Owner sees the doc; a stranger can't read or edit it
- [x] Viewer can read but not edit or reshare
- [x] Upgrading to editor allows edits; formatting (`<h1>`, `<strong>`) persists
- [x] Unknown email and sharing with yourself are rejected; revoking removes access
- [x] Markdown import produces headings/lists; `.txt` import escapes `<script>`
- [x] Unsupported (`.pdf`) and empty files are rejected
- [x] Markdown tables and task lists survive import (`tests/fixtures/all-formatting.md`)
- [x] Sign-up: right password only, duplicate email (any case) rejected, seeded users can't password-login, new user can receive a share

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

### Browser: import fidelity
- [x] `tests/fixtures/all-formatting.md`: H1–H6, bold/italic/strikethrough, inline code, link, line break, nested lists, task lists, quote, code block, divider, table, image
- [x] `PLAN.md` (several tables) imports with real tables

### Browser: accounts
- [x] Create account → lands on an empty dashboard
- [x] Wrong password → "Wrong email or password"; email kept, password cleared
- [x] Duplicate email in different case → "An account with that email already exists"
- [x] Sign in with the right password; **Sign out** from dashboard and editor

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

### Browser: presence and save conflicts
- [x] Simulated a second user viewing the doc (presence row via SQL; the automation tab reports as hidden, so visibility was overridden) → "Also here:" with their initials appeared in the title row within one heartbeat
- [x] Simulated a second user's save (via SQL) → editor showed "Someone else saved a newer version…" with a Reload button; autosave stopped so nothing was silently lost
- [x] After reload, the second user's content was not overwritten; editor resumed normal autosave
- [x] Continuous typing produced no false conflict (version check working correctly)

### Not verified
- [ ] Presence with two real browser profiles (the second user was simulated via SQL)
- [ ] PDF print preview (the print dialog blocks browser automation)
- [ ] 375px layout in a real browser (macOS minimum window width); checked in code only (share panel stacks below `lg`)

## Bugs found during testing

| Bug | Found by | Fix |
|---|---|---|
| Local embedded DB crashed on a fresh checkout (missing data directory) | Browser walkthrough + server log | Later removed entirely when moving to a single Neon database |
| Slow server round trip let a double-click create two documents | Browser walkthrough | `SubmitButton` disables and shows pending text while the action runs |
| Markdown tables flattened into one paragraph on import | User testing (imported `PLAN.md`) | Added Tiptap table / task-list / image extensions; fixture-based test |
| Sign-in error carried over into the sign-up form | Code review of generated UI | Separate action state per mode |
| "Shared with me" label read as if the owner were the editor | User testing | Owner and your access shown separately |
