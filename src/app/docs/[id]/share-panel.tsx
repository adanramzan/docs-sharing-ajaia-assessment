"use client";
import { useActionState } from "react";
import type { Share } from "@/lib/docs";
import { deleteDocument, shareDocument, unshareDocument } from "../../actions";

export function SharePanel(props: { docId: string; isOwner: boolean; ownerName: string; shares: Share[]; userEmails: string[] }) {
  const { docId, isOwner, shares } = props;
  const [state, action, pending] = useActionState(shareDocument.bind(null, docId), null);

  return (
    <aside className="h-fit space-y-4 rounded border bg-white p-4 text-sm">
      <h2 className="font-semibold">Sharing</h2>
      <ul className="space-y-2">
        <li className="flex justify-between">
          <span>{props.ownerName}</span>
          <span className="text-gray-500">owner</span>
        </li>
        {shares.map((s) => (
          <li key={s.user_id} className="flex items-center justify-between gap-2">
            <span className="truncate" title={s.email}>
              {s.name}
            </span>
            <span className="flex items-center gap-2 text-gray-500">
              {s.role}
              {isOwner && (
                <button
                  onClick={() => unshareDocument(docId, s.user_id)}
                  className="text-red-600 hover:underline"
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
        <form action={action} className="space-y-2 border-t pt-4">
          <label className="block text-xs font-medium text-gray-600" htmlFor="share-email">
            Share with (email)
          </label>
          <input
            id="share-email"
            name="email"
            type="email"
            required
            list="seeded-emails"
            placeholder="bob@ajaia.test"
            className="w-full rounded border px-2 py-1.5"
          />
          <datalist id="seeded-emails">
            {props.userEmails.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
          <div className="flex gap-2">
            <select name="role" className="flex-1 rounded border px-2 py-1.5" defaultValue="editor">
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button disabled={pending} className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50">
              Share
            </button>
          </div>
          {state && !state.ok && <p className="text-red-600">{state.error}</p>}
          {state?.ok && <p className="text-green-700">Shared.</p>}
        </form>
      ) : (
        <p className="border-t pt-4 text-xs text-gray-500">Only the owner can change sharing.</p>
      )}

      {isOwner && (
        <form
          action={deleteDocument.bind(null, docId)}
          onSubmit={(e) => !confirm("Delete this document for everyone?") && e.preventDefault()}
          className="border-t pt-4"
        >
          <button className="text-xs text-red-600 hover:underline">Delete document</button>
        </form>
      )}
    </aside>
  );
}
