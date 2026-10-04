# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Deciding audience: Ajaia reviewers** evaluating this as a 4-hour Full Stack Product Engineer take-home. They judge it through the live demo, a 3–5 minute walkthrough video, and the code. They need to see a coherent, trustworthy product within minutes.
- **Modeled user: knowledge workers** who want to write without distraction, then share a document with a colleague as a viewer or editor.

## Product Purpose

Ajaia Docs is a lightweight, Google Docs-inspired collaborative editor. You can create, rename, format, import (.txt/.md/.docx) and share rich-text documents, which persist in Postgres. Success means a reviewer can run the full flow without friction: log in, create, format, refresh to see it persist, import, share with a role, switch user, and see the access result. The product should feel deliberate and calm.

## Positioning

Calm, focused writing plus simple role-based sharing. It deliberately does less than Google Docs (no real-time co-editing, comments or version history), so writing stays undistracted and sharing reduces to one clear decision per person: *can view* or *can edit*.

## Operating Context

- Mocked auth: a login picker with three seeded accounts (Alice Chen, Bob Patel, Carol Diaz, all `@ajaia.test`) plus email + password sign-up, and a "Sign out" control for switching accounts to demonstrate sharing.
- The dashboard separates "My documents" from "Shared with me". The document page has an inline title, debounced autosave with a status indicator, a formatting toolbar, and a Sharing panel.
- Roles: owner (full control, can share and delete), editor (edits, sharing is read-only), viewer (read-only, no toolbar).
- A "Document not available" page appears for both missing docs and docs the user can't access, and it deliberately doesn't reveal which.

## Capabilities and Constraints

- Stack: Next.js 16 (App Router, server actions), React 19, Tiptap 3, Tailwind 4, Postgres (Neon via Vercel), zod, vitest.
- Formatting: bold, italic, underline, H1–H3, bulleted and numbered lists, undo/redo.
- Import: .txt, .md and .docx up to 4MB. Other types are rejected with a clear message.
- Concurrent edits are last-write-wins.
- **Binding design constraints:** light theme only; warm neutral grays with one red accent (#ec3013; #ae1800 for text-safe contrast); system font stack or at most one Google Font; WCAG AA contrast with visible focus states on every control; works at ~375px (the share panel stacks under the editor below `lg`); no new features; layout may change (editorial: masthead, paper sheet, serif writing surface) but copy stays and no features are added; inline messages, no toasts.
- Out of scope: real-time co-editing, real auth, comments/suggestions, version history.

## Brand Commitments

- Name: "Ajaia Docs".
- Tone: clean, calm, quietly professional; no decoration beyond what helps focus.
- Existing UI copy is specified in `SCREENS.md`. Keep it unless asked to change it.

## Evidence on Hand

- `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, `ASSIGNMENT.md`, `SCREENS.md` (the screen-by-screen state brief).
- Automated tests in `tests/docs.test.ts` (sharing, roles, import).
- No users, testimonials or metrics exist; never fabricate them.

## Product Principles

1. The writing surface comes first; chrome recedes.
2. Every role and state is legible at a glance: who owns this, what can I do, is it saved.
3. Restraint over features: polish what exists rather than adding scope.
4. Errors are explicit and inline; nothing fails silently.

## Accessibility & Inclusion

WCAG AA: contrast (watch light gray text), visible focus rings, a toolbar with `role="toolbar"` and `aria-pressed`, labelled inputs, and errors announced with `role="alert"`.
