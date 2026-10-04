"use client";
import { useActionState } from "react";
import { uploadDocument } from "./actions";
import { btnSecondary } from "./ui";

export function UploadForm() {
  const [state, action, pending] = useActionState(uploadDocument, null);
  return (
    <form action={action} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          name="file"
          accept=".txt,.md,.docx"
          required
          disabled={pending}
          className="w-52 max-w-full text-[13px] text-neutral-700 file:mr-2 file:cursor-pointer file:border file:border-control file:px-3 file:py-2 file:text-[13px] file:font-extrabold file:text-text hover:file:bg-text/7 disabled:file:opacity-45"
        />
        <button disabled={pending} className={`${btnSecondary} py-2`}>
          {pending ? "Importing…" : "Import as new doc"}
        </button>
      </div>
      <p className="text-xs text-neutral-700">Supported: .txt, .md, .docx (max 4MB)</p>
      {state && !state.ok && <p role="alert" className="text-[13px] font-semibold text-danger">{state.error}</p>}
    </form>
  );
}
