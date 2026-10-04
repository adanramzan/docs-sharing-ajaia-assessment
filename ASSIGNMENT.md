# Assignment Checklist — Ajaia Full Stack Product Engineer

Build a lightweight collaborative document editor (Google Docs–inspired). Timebox: 4 hours.
The live submission form needs a **video link** and a **Markdown submission** (max 1000 lines).

## 1. Core features

| # | Requirement | Plan / where | Status |
|---|---|---|---|
| 1.1 | Create document | Dashboard "+ New document" | ✅ built |
| 1.2 | Rename document | Title field in editor (autosaves) | ✅ built |
| 1.3 | Edit in browser | Tiptap editor | ✅ built |
| 1.4 | Save & reopen | Debounced autosave → Postgres | ✅ built |
| 1.5 | Bold / italic / underline | Toolbar + shortcuts | ✅ built |
| 1.6 | Headings | H1 / H2 / H3 (H4–H6 kept on import) | ✅ built |
| 1.7 | Bulleted / numbered lists | Toolbar | ✅ built |
| 2 | File upload | `.txt` / `.md` / `.docx` → new editable doc (4MB max, stated in UI) | ✅ built |
| 3.1 | Document owner | `documents.owner_id` | ✅ built |
| 3.2 | Grant another user access | Share panel, by email, viewer/editor role | ✅ built |
| 3.3 | Owned vs shared distinction | "My documents" / "Shared with me" sections | ✅ built |
| 3.4 | Users | 3 seeded accounts (one-click login) + sign-up with email + password | ✅ built |
| 4 | Persistence | One Postgres (Neon via Vercel), used locally and in prod | ✅ built |

## 2. Engineering quality

| Requirement | Plan | Status |
|---|---|---|
| Setup & run instructions | `README.md` | ✅ done |
| Live deployment | Vercel + Neon Postgres | ✅ live at https://docs-sharing-ajaia-assessment.vercel.app |
| Validation & error handling | zod on server actions, role checks in `lib/docs.ts`, UI error messages | ✅ built |
| ≥1 meaningful automated test | `tests/docs.test.ts` — sharing/roles/import, save conflicts, presence against the real Postgres | ✅ 13 passing against Neon (`tests/docs.test.ts`, `tests/users.test.ts`) |
| Architecture note | `ARCHITECTURE.md` | ✅ done |

## 3. Written deliverables

- [x] `README.md` — local setup, run, test, seeded users, supported file types
- [x] `ARCHITECTURE.md` — what was prioritized and why, scope cuts
- [x] `AI_WORKFLOW.md` — tools used, where AI sped things up, what was changed/rejected, how verified
- [x] `PLAN.md` — kickoff plan, plan vs. actual
- [x] `PROGRESS.md` — milestone status and test log
- [x] `SUBMISSION.md` — exact list of what's included, live URL, test accounts, what works / incomplete / next 2–4 hours
- [ ] `VIDEO_URL.txt` — walkthrough link (placeholder in repo)
- [ ] Screenshots (optional; only if setup needs extra steps)

## 4. Walkthrough video (3–5 min, unlisted Loom/YouTube)

1. Main flow: log in as Alice → new doc → format → rename → refresh (persists)
2. Import a `.md`/`.docx` file
3. Share with Bob as viewer → switch to Bob → "Shared with me", read-only → upgrade to editor
4. Stretch: Download .md / Export PDF; presence and the conflict prompt (two browser profiles)
5. What was deprioritized (real-time co-editing, real auth, comments, version history)
6. Key decisions (Tiptap, server actions, access checks in one module, single Postgres)
7. How AI was used

## 5. Submission

- [x] Push code to GitHub: `adanramzan/docs-sharing-ajaia-assessment`
- [x] Deploy on Vercel, add Neon Postgres from Storage tab
- [ ] Google Drive folder with all materials
- [ ] Paste video link + submission Markdown into the form, then submit

## 6. Optional stretch (only if core is done)

- [x] Export to Markdown and PDF ("Download .md" / "Export PDF" on every document)
- [x] Real-time collaboration indicators ("Also here:" presence) + save conflict check (stale saves rejected with a reload prompt)
- Role-based permissions (viewer/editor) — ✅ already built

## Deliberately out of scope

Real-time multi-user editing (CRDT/websockets for merged edits), real authentication, comments/suggestions, version history.
