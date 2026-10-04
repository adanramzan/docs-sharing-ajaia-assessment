"use client";
import { useActionState, useState, useTransition } from "react";
import type { Share } from "@/lib/docs";
import { deleteDocument, shareDocument, unshareDocument } from "../../actions";
import { SubmitButton } from "../../submit-button";
import { btnPrimary, input, linkDanger, Loader, RolePill, stagger } from "../../ui";

const row = "flex items-center justify-between gap-2 border-b border-divider py-2";

function RemoveButton({ docId, share }: { docId: string; share: Share }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const r = await unshareDocument(docId, share.user_id);
            setMsg(r.ok ? { ok: true, text: `Removed ${share.name}.` } : { ok: false, text: r.error });
          })
        }
        className={`${linkDanger} relative overflow-hidden px-1 py-0.5 disabled:opacity-100!`}
        aria-label={`Remove ${share.name}`}
      >
        remove
        {pending && <Loader label={`Removing ${share.name}`} compact />}
      </button>
      {msg?.ok && <span role="status" className="sr-only">{msg.text}</span>}
      {msg && !msg.ok && <span role="alert" className="text-xs font-semibold text-danger">{msg.text}</span>}
    </>
  );
}

export function SharePanel(props: { docId: string; isOwner: boolean; ownerName: string; shares: Share[]; userEmails: string[] }) {
  const { docId, isOwner, shares } = props;
  const [state, action, pending] = useActionState(shareDocument.bind(null, docId), null);

  const showErr = !pending && state && !state.ok;
  // Hide "Shared." once that person has been removed again.
  const showOk = !pending && state?.ok && shares.some((s) => s.email.toLowerCase() === state.email.trim().toLowerCase());
  return (
    <aside className="flex h-fit flex-col gap-4 border-t-2 border-text pt-3 text-sm lg:sticky lg:top-6">
      <h2 className="text-[11px] leading-none font-extrabold tracking-[.14em] uppercase">Sharing</h2>
      <ul className="border-t border-divider">
        <li className={row}>
          <span>{props.ownerName}</span>
          <RolePill role="owner" />
        </li>
        {shares.map((s, i) => (
          <li key={s.user_id} className={`${row} rise`} style={stagger(i + 1)}>
            <span className="truncate" title={s.email}>
              {s.name}
            </span>
            <span className="flex items-center gap-2.5">
              <RolePill role={s.role} />
              {isOwner && (
                <RemoveButton docId={docId} share={s} />
              )}
            </span>
          </li>
        ))}
      </ul>

      {isOwner ? (
        <form key={state ? (state.ok ? "ok" : state.email) : "new"} action={action} className="flex flex-col gap-2 pt-4">
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
            defaultValue={state && !state.ok ? state.email : ""}
            aria-invalid={showErr || undefined}
            aria-describedby={showErr ? "share-error" : undefined}
            className={input}
          />
          <datalist id="seeded-emails">
            {props.userEmails.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
          <div className="flex gap-2">
            <select name="role" aria-label="Permission" className={`${input} flex-1`} defaultValue={state?.role ?? "editor"}>
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button disabled={pending} className={`${btnPrimary} relative overflow-hidden py-2 disabled:opacity-100!`}>
              Share
              {pending && <Loader label="Sharing" compact />}
            </button>
          </div>
          {showErr && (
            <p id="share-error" role="alert" className="font-semibold text-danger">
              {state.error}
            </p>
          )}
          {showOk && <p role="status" className="font-semibold text-success">Shared.</p>}
        </form>
      ) : (
        <p className="pt-4 text-[13px] text-neutral-700">Only the owner can change sharing.</p>
      )}

      {isOwner && (
        <form
          action={deleteDocument.bind(null, docId)}
          onSubmit={(e) => !confirm("Delete this document for everyone?") && e.preventDefault()}
          className="border-t border-divider pt-4"
        >
          <SubmitButton className={linkDanger} pendingText="Deleting…">
            Delete document
          </SubmitButton>
        </form>
      )}
    </aside>
  );
}
