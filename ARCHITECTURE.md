# Architecture Note

## Shape

One Next.js 16 app (App Router) deployed on Vercel: React UI, server actions as the API, Postgres for storage.

```
Browser (Tiptap editor, forms)
   │  server actions (zod validation)
   ▼
src/app/actions.ts ──► src/lib/docs.ts (access rules + SQL) ──► src/lib/db.ts ──► Postgres (Neon)
```

## What I prioritized and why

1. **Correct access control over feature count.** Every read/write goes through `lib/docs.ts`, which takes the acting user and checks role (`owner` / `editor` / `viewer`) in the same SQL that fetches the doc. Pages and actions can't skip a check because there is no other path to the data. This is the area most likely to be subtly wrong, so it's also what the tests cover.
2. **A usable editor, not a custom one.** Tiptap (ProseMirror) gives a solid editing core, keyboard shortcuts, and a schema. I spent time on the parts users feel: toolbar active states, debounced autosave with visible status, retry-on-failure, flush on tab close.
3. **One database everywhere.** Local dev, tests, and production all use the same Postgres (Neon, free via Vercel). No second engine to keep in sync, so what's tested is what runs. Schema and seed users are created on first connection, so there's no migration step.
4. **File import that produces a real document.** `.txt`/`.md`/`.docx` become new editable docs (mammoth for docx, marked for md). The editor loads everything they emit (tables, task lists, links, images) so nothing is silently flattened. That makes import useful, not just an attachment.

## Data model

```
users(id, name, email, password_hash NULL)   ← seeded users have NULL (one-click only)
documents(id, owner_id → users, title, content HTML, created_at, updated_at)
shares(doc_id → documents, user_id → users, role 'viewer'|'editor')   PK(doc_id, user_id)
```

## Key decisions

| Decision | Why | Tradeoff |
|---|---|---|
| Store content as HTML | Tiptap reads/writes it natively; imports produce HTML; readable in DB | Less structured than ProseMirror JSON; fine at this scope |
| Editor schema as sanitizer | Content is only ever rendered through Tiptap, which drops unknown tags/attrs, so imported or stored markup can't inject script | Would need explicit sanitizing if HTML were ever rendered directly |
| Server actions instead of a REST API | Less code, typed end to end, built-in CSRF protection | No public API for other clients |
| Email + password sign-up (scrypt hashing, httpOnly cookie) | Brief allows mocked auth; added sign-up after core was shipped. Passwords use Node's built-in `scrypt` (16-byte salt, `timingSafeEqual` compare). Seeded demo users skip password login. | The `uid` cookie is unsigned; no password reset, email verification, session expiry, or rate limiting. Before real use: signed sessions, Auth.js/Clerk. |
| Viewer/editor roles | Small extra cost on top of basic sharing, makes the model realistic | — |
| Last-write-wins saves | Real-time co-editing (CRDT + websockets) is a project on its own | Two simultaneous editors can overwrite each other |

## Deliberately out of scope

Real-time collaboration/presence, comments/suggestions, version history, real authentication, sharing to non-registered emails, image embeds, pagination/search of the doc list.

## What I'd build next (2–4 hours)

1. Conflict safety: send `updated_at` with each save and reject stale writes (optimistic concurrency), surfacing "this doc changed, reload".
2. Real auth (Auth.js with email magic link) replacing the user picker.
3. Version history: snapshot content on save into a `document_versions` table, with restore.
4. Export to Markdown/PDF; Playwright test for the share → switch user → read-only flow.
