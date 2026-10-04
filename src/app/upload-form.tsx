"use client";
import { useActionState } from "react";
import { uploadDocument } from "./actions";

export function UploadForm() {
  const [state, action, pending] = useActionState(uploadDocument, null);
  return (
    <form action={action} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          accept=".txt,.md,.docx"
          required
          className="text-sm file:mr-2 file:rounded file:border file:bg-white file:px-3 file:py-1.5 file:text-sm"
        />
        <button disabled={pending} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50">
          {pending ? "Importing…" : "Import as new doc"}
        </button>
      </div>
      <p className="text-xs text-gray-500">Supported: .txt, .md, .docx (max 4MB)</p>
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
