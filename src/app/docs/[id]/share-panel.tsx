"use client";
import { useActionState } from "react";
import type { Share } from "@/lib/docs";
import { deleteDocument, shareDocument, unshareDocument } from "../../actions";
import { SubmitButton } from "../../submit-button";
import { btnPrimary, input, linkDanger, RolePill } from "../../ui";

const row = "flex items-center justify-between gap-2 border-b border-divider py-2";

export function SharePanel(props: { docId: string; isOwner: boolean; ownerName: string; shares: Share[]; userEmails: string[] }) {
  const { docId, isOwner, shares } = props;
  const [state, action, pending] = useActionState(shareDocument.bind(null, docId), null);

  return (
    <aside className="flex h-fit flex-col gap-4 border border-divider bg-neutral-100 p-4 text-sm">
      <h2 className="text-base">Sharing</h2>
      <ul className="border-t-2 border-divider">
        <li className={row}>
          <span>{props.ownerName}</span>
          <RolePill role="owner" />
        </li>
        {shares.map((s) => (
          <li key={s.user_id} className={row}>
            <span className="truncate" title={s.email}>
              {s.name}
            </span>
            <span className="flex items-center gap-2.5">
              <RolePill role={s.role} />
              {isOwner && (
                <button
                  onClick={() => unshareDocument(docId, s.user_id)}
                  className={linkDanger}
                  aria-label={`Remove ${s.name}`}
                >
                  remove
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {isOwner ? (
        <form action={action} className="flex flex-col gap-2 border-t-2 border-divider pt-4">
          <label className="text-xs font-semibold text-neutral-800" htmlFor="share-email">
            Share with (email)
          </label>
          <input
            id="share-email"
            name="email"
            type="email"
            required
            list="seeded-emails"
            placeholder="bob@ajaia.test"
            aria-invalid={state ? !state.ok : undefined}
            aria-describedby={state && !state.ok ? "share-error" : undefined}
            className={input}
          />
          <datalist id="seeded-emails">
            {props.userEmails.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
          <div className="flex gap-2">
            <select name="role" className={`${input} flex-1`} defaultValue="editor">
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button disabled={pending} className={`${btnPrimary} py-2`}>
              Share
            </button>
          </div>
          {state && !state.ok && (
            <p id="share-error" role="alert" className="font-semibold text-accent-700">
              {state.error}
            </p>
          )}
          {state?.ok && <p role="status" className="font-semibold text-success">Shared.</p>}
        </form>
      ) : (
        <p className="border-t-2 border-divider pt-4 text-[13px] text-neutral-700">Only the owner can change sharing.</p>
      )}

      {isOwner && (
        <form
          action={deleteDocument.bind(null, docId)}
          onSubmit={(e) => !confirm("Delete this document for everyone?") && e.preventDefault()}
          className="border-t-2 border-divider pt-4"
        >
          <SubmitButton className={linkDanger} pendingText="Deleting…">
            Delete document
          </SubmitButton>
        </form>
      )}
    </aside>
  );
}
