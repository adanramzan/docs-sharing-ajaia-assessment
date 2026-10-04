# Ajaia Docs — Screen Design Brief

> The original brief handed to Claude Design, generated from the code by a subagent. Kept as-is for the record; the final accent became red instead of blue (see `PRODUCT.md`).

## 1. Product

Ajaia Docs is a lightweight Google Docs-style editor: create, import, format and share rich-text documents. Users are knowledge workers who want to write without distraction. The UI should feel clean, calm and quietly professional, like a productivity tool. Light theme only, generous whitespace, one accent color (currently blue-600), neutral grays, and no decoration beyond what helps people focus.

## 2. Screens

### 2.1 Login picker (`/` when signed out)
- **Purpose:** mocked auth. Pick a seeded account.
- **Elements:** heading "Ajaia Docs"; helper text "Demo login: pick a seeded account. Use two accounts to try sharing."; three full-width account buttons, each with a name and an email below it: Alice Chen / alice@ajaia.test, Bob Patel / bob@ajaia.test, Carol Diaz / carol@ajaia.test.
- **States:** default, hover/focus on one button, pressed (submitting). Narrow centered column (~max-w-sm).

### 2.2 Dashboard (`/` when signed in)
- **Purpose:** start or open documents.
- **Header:** "Ajaia Docs" on the left; on the right, "{name} ({email})" and a "Switch user" button.
- **Actions row:** primary button "+ New document"; import group with a file input (accepts .txt, .md, .docx), secondary button "Import as new doc", and hint "Supported: .txt, .md, .docx (max 4MB)".
- **Lists:** section labels "My documents" and "Shared with me" (small, uppercase, gray). Each row shows the title (truncated) on the left and the updated date/time on the right. Shared rows also get a pill "{owner_name} · {role}" (role = editor or viewer). The whole row links to the document.
- **States to show:**
  - Empty: "No documents yet. Create one or import a file." / "Nothing has been shared with you yet." (dashed box).
  - Populated: 3–5 owned rows, plus shared rows with both an editor and a viewer pill.
  - Import pending: button reads "Importing…" and is disabled.
  - Import error: red text under the hint, e.g. "Choose a file to upload." or "Something went wrong. Please try again."
  - Creating: "+ New document" pressed and redirecting (a subtle pending state is fine).

### 2.3 Document editor, owner (`/docs/[id]`)
- **Top nav:** "← All documents" link; on the right, "Signed in as {name} · **owner**".
- **Layout:** two columns at lg and up. Editor on the left (fluid), Sharing panel on the right (280px).
- **Title row:** inline-editable title input (large, semibold, borderless until hover/focus, max 200 chars), with the save-status indicator to its right.
- **Editor card:** white card with a sticky formatting toolbar and a writing area (~60vh min, roomy padding).
- **Toolbar:** B, I, U, H1, H2, H3, "• List", "1. List", ↶ (Undo), ↷ (Redo).
- **Sharing panel:** heading "Sharing"; owner row "{owner name} — owner"; shared-user rows "{name} — {role} — remove"; a divider; then the form: label "Share with (email)", email input (placeholder "bob@ajaia.test", suggestions from seeded emails), role select "Can edit" / "Can view", button "Share"; a divider; "Delete document" (small red text link that opens a native confirm: "Delete this document for everyone?").
- **States:**
  - Save status: "All changes saved" / "Unsaved changes…" / "Saving…" / "Save failed: {message}" (red).
  - New doc: title "Untitled document", empty body, no shares.
  - Populated doc with headings, lists and bold text, and 2 shares (one editor, one viewer).
  - Share success: green "Shared." Share errors (red): "No user with email x@y.", "You already own this document.", "Enter a valid email." Share pending: button disabled.

### 2.4 Document editor, editor role (shared)
- Same as 2.3 except: the nav reads "Signed in as {name} · **editor** · owned by {owner}"; the panel lists people with no remove links and no delete; the form is replaced by gray text "Only the owner can change sharing."
- Toolbar and save status stay as they are. Also show a save failure caused by losing access: "Save failed: Document not found or you don't have access."

### 2.5 Document editor, viewer (read-only)
- The nav reads "· **viewer** · owned by {owner}". The title is read-only (no hover border), a gray pill "View only" replaces the save status, there is **no toolbar**, and the body is not editable. The panel is the same as 2.4.

### 2.6 Not found / no access (proposed; currently the default Next 404)
- **Purpose:** shown when a doc doesn't exist or the user isn't allowed to see it (the app deliberately doesn't reveal which).
- **Proposed copy:** heading "Document not available"; body "It may have been deleted, or you don't have access. Ask the owner to share it with you."; primary button "← Back to all documents". Keep the same centered narrow column as the login screen.

## 3. Shared components

- **Toolbar button:** default, hover, active/pressed (`aria-pressed=true`: tinted blue background with blue text), focus-visible ring, disabled (undo/redo when there's nothing to undo or redo). Min 32px wide. B/I/U render bold, italic and underlined.
- **Save-status indicator:** 4 text states plus the error state (red, `role="alert"`). Small and low-emphasis; it must not shift the layout when the text changes.
- **Role badge/pill:** owner / editor / viewer, and "View only". Neutral gray; a tint per role is fine if contrast holds.
- **Doc list row:** title + meta (optional owner·role pill + timestamp), hover, focus, and long-title truncation.
- **Share panel row:** name (tooltip shows email), role, optional "remove" (red text button).
- **Buttons:** primary (filled blue), secondary (bordered), destructive text link (red), and disabled for each.
- **Inputs:** text/email input, select, file input, title input (borderless variant). Show default, focus, and error message below.
- **Messages:** inline error (red) and inline success (green), with no toasts.

## 4. Constraints

- It must be implementable with Tailwind utility classes in **under an hour** on the existing markup. Restyle what exists; don't restructure it.
- **No new features** (no avatars, comments, search, real-time presence, or menus that don't exist).
- Desktop-first, but it has to work at **~375px**. Below the `lg` breakpoint the share panel stacks under the editor, the toolbar wraps, and the dashboard header and actions wrap.
- Accessibility: WCAG AA contrast (watch the gray-400/500 text), visible focus states on every control, toolbar `role="toolbar"` with `aria-pressed`, labelled inputs, and errors announced.
- Light theme only. System font stack, or one Google Font at most.

## 5. Prompt for Claude Design

> Design the UI for "Ajaia Docs", a lightweight Google Docs-style editor (Next.js + Tiptap + Tailwind). The tone should be clean, calm and professional: light theme, neutral grays, one blue accent. Mock up these screens: (1) a login picker with three seeded accounts (Alice Chen, Bob Patel, Carol Diaz); (2) a dashboard with "+ New document", a file import (.txt/.md/.docx, max 4MB) and "My documents" / "Shared with me" lists, in empty, populated and import-error states; (3) the document page for an owner, with an inline title, an autosave status (All changes saved / Unsaved changes… / Saving… / Save failed), a formatting toolbar (B I U H1 H2 H3, bulleted and numbered lists, undo/redo) and a right-hand Sharing panel (people list with remove, email + Can edit/Can view + Share, success and error messages, Delete document); (4) the same page for an editor, where sharing is read-only and shows "Only the owner can change sharing."; (5) a viewer version with a "View only" badge and no toolbar; (6) a simple "Document not available" page. Also show component states: toolbar active/hover/focus/disabled, role pills, list rows, buttons and inputs. Don't add features. It must be buildable in Tailwind in under an hour, work at 375px (the share panel stacks under the editor below lg), and meet AA contrast with visible focus rings.
