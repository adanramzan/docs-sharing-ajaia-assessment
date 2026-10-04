"use client";
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { saveDocument } from "../../actions";

type Status = "saved" | "unsaved" | "saving" | { error: string };

export function Editor(props: { docId: string; initialTitle: string; initialContent: string; canEdit: boolean }) {
  const { docId, canEdit } = props;
  const [title, setTitle] = useState(props.initialTitle);
  const [status, setStatus] = useState<Status>("saved");
  const pending = useRef<{ title?: string; content?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced autosave: batch title/content changes, write 800ms after the last keystroke.
  async function flush() {
    clearTimeout(timer.current);
    const patch = pending.current;
    if (patch.title === undefined && patch.content === undefined) return;
    pending.current = {};
    setStatus("saving");
    const res = await saveDocument(docId, patch);
    if (res.ok) setStatus((s) => (s === "saving" ? "saved" : s));
    else {
      pending.current = { ...patch, ...pending.current }; // keep the edit so the next save retries it
      setStatus({ error: res.error });
    }
  }
  function queue(patch: { title?: string; content?: string }) {
    pending.current = { ...pending.current, ...patch };
    setStatus("unsaved");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false })],
    content: props.initialContent,
    editable: canEdit,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: "tiptap min-h-[40vh] p-5 sm:min-h-[60vh] sm:px-10 sm:py-8 focus:outline-none" } },
    onUpdate: ({ editor }) => queue({ content: editor.getHTML() }),
  });

  // Flush on tab close / navigation away so the last edits aren't lost.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.title !== undefined || pending.current.content !== undefined) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
        <input
          value={title}
          readOnly={!canEdit}
          aria-label="Document title"
          maxLength={200}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) queue({ title: e.target.value });
          }}
          onBlur={() => !title.trim() && setTitle(props.initialTitle)}
          className="min-w-0 flex-[1_1_100%] border border-transparent bg-transparent px-2 py-1 text-2xl leading-tight font-extrabold tracking-[-.015em] read-only:cursor-default hover:border-divider read-only:hover:border-transparent focus-visible:border-accent focus-visible:bg-neutral-100 focus-visible:outline-offset-0 sm:flex-1 sm:text-[30px]"
        />
        <SaveStatus status={canEdit ? status : "readonly"} />
      </div>
      <div className="border border-divider bg-neutral-100 shadow-sm">
        {canEdit && editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function SaveStatus({ status }: { status: Status | "readonly" }) {
  // Fixed 200px slot on desktop so the title doesn't jump as the status text changes.
  const slot = "pl-2.5 text-xs leading-[1.35] sm:w-[200px] sm:shrink-0 sm:pl-0 sm:text-right";
  if (status === "readonly")
    return (
      <span className={`${slot} sm:flex sm:justify-end`}>
        <span className="inline-flex border border-neutral-400 bg-neutral-200 px-2.5 py-[3px] text-[11px] font-semibold whitespace-nowrap text-neutral-800">View only</span>
      </span>
    );
  if (typeof status === "object") return <span className={`${slot} font-semibold text-accent-700`} role="alert">Save failed: {status.error}</span>;
  const label = { saved: "All changes saved", unsaved: "Unsaved changes…", saving: "Saving…" }[status];
  return <span className={`${slot} text-neutral-700`} role="status">{label}</span>;
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const chain = () => editor.chain().focus();
  const buttons: [string, string, () => void, boolean, boolean?][] = [
    ["B", "Bold", () => chain().toggleBold().run(), editor.isActive("bold")],
    ["I", "Italic", () => chain().toggleItalic().run(), editor.isActive("italic")],
    ["U", "Underline", () => chain().toggleUnderline().run(), editor.isActive("underline")],
    ["H1", "Heading 1", () => chain().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 })],
    ["H2", "Heading 2", () => chain().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 })],
    ["H3", "Heading 3", () => chain().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 })],
    ["• List", "Bulleted list", () => chain().toggleBulletList().run(), editor.isActive("bulletList")],
    ["1. List", "Numbered list", () => chain().toggleOrderedList().run(), editor.isActive("orderedList")],
    ["↶", "Undo", () => chain().undo().run(), false, !editor.can().undo()],
    ["↷", "Redo", () => chain().redo().run(), false, !editor.can().redo()],
  ];
  return (
    <div className="z-10 flex flex-wrap gap-1 border-b-2 border-divider bg-surface p-2 sm:sticky sm:top-0" role="toolbar" aria-label="Formatting">
      {buttons.map(([label, name, onClick, active, disabled]) => (
        <button
          key={name}
          type="button"
          title={name}
          aria-label={name}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={`h-8 min-w-8 cursor-pointer px-2 text-[13px] font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45 ${
            active ? "bg-accent-100 text-accent-800 shadow-[inset_0_-2px_0_var(--color-accent)]" : "enabled:hover:bg-neutral-300"
          } ${label === "B" ? "font-extrabold" : label === "I" ? "italic" : label === "U" ? "underline" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
