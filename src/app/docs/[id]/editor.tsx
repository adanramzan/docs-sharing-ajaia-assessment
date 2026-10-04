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
    editorProps: { attributes: { class: "tiptap min-h-[60vh] px-10 py-8 focus:outline-none" } },
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
      <div className="mb-3 flex items-center gap-3">
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
          className="min-w-0 flex-1 rounded border border-transparent px-2 py-1 text-2xl font-semibold hover:border-gray-200 focus:border-blue-400 focus:outline-none"
        />
        <SaveStatus status={canEdit ? status : "readonly"} />
      </div>
      <div className="rounded border bg-white shadow-sm">
        {canEdit && editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function SaveStatus({ status }: { status: Status | "readonly" }) {
  if (status === "readonly") return <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">View only</span>;
  if (typeof status === "object") return <span className="text-xs text-red-600" role="alert">Save failed: {status.error}</span>;
  const label = { saved: "All changes saved", unsaved: "Unsaved changes…", saving: "Saving…" }[status];
  return <span className="shrink-0 text-xs text-gray-500">{label}</span>;
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const chain = () => editor.chain().focus();
  const buttons: [string, string, () => void, boolean][] = [
    ["B", "Bold", () => chain().toggleBold().run(), editor.isActive("bold")],
    ["I", "Italic", () => chain().toggleItalic().run(), editor.isActive("italic")],
    ["U", "Underline", () => chain().toggleUnderline().run(), editor.isActive("underline")],
    ["H1", "Heading 1", () => chain().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 })],
    ["H2", "Heading 2", () => chain().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 })],
    ["H3", "Heading 3", () => chain().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 })],
    ["• List", "Bulleted list", () => chain().toggleBulletList().run(), editor.isActive("bulletList")],
    ["1. List", "Numbered list", () => chain().toggleOrderedList().run(), editor.isActive("orderedList")],
    ["↶", "Undo", () => chain().undo().run(), false],
    ["↷", "Redo", () => chain().redo().run(), false],
  ];
  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b bg-gray-50 p-2" role="toolbar" aria-label="Formatting">
      {buttons.map(([label, name, onClick, active]) => (
        <button
          key={name}
          type="button"
          title={name}
          aria-label={name}
          aria-pressed={active}
          onClick={onClick}
          className={`min-w-8 rounded px-2 py-1 text-sm ${active ? "bg-blue-100 text-blue-800" : "hover:bg-gray-200"} ${
            label === "B" ? "font-bold" : label === "I" ? "italic" : label === "U" ? "underline" : ""
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
