"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { EditorContent, useEditor, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Image from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import { saveDocument } from "../../actions";
import { btnSecondary } from "../../ui";
import { PresenceList, usePresence } from "./presence";

type Status = "saved" | "unsaved" | "saving" | { error: string; conflict?: boolean };
const NEWER = "Someone else saved a newer version.";

export function Editor(props: { docId: string; initialTitle: string; initialContent: string; initialVersion: number; canEdit: boolean }) {
  const { docId, canEdit } = props;
  const [title, setTitle] = useState(props.initialTitle);
  const [status, setStatus] = useState<Status>("saved");
  const pending = useRef<{ title?: string; content?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inflight = useRef(false);
  const version = useRef(props.initialVersion); // the version our next save is based on
  const conflict = useRef(false); // once set, autosave stops until the user reloads
  const presence = usePresence(docId);

  // Debounced autosave: batch title/content changes, write 800ms after the last keystroke.
  async function flush() {
    clearTimeout(timer.current);
    if (conflict.current) return;
    const patch = pending.current;
    if (patch.title === undefined && patch.content === undefined) return;
    if (inflight.current) { // a save sent with the old version would conflict with ourselves
      timer.current = setTimeout(flush, 300);
      return;
    }
    pending.current = {};
    setStatus("saving");
    inflight.current = true;
    const res = await saveDocument(docId, patch, version.current).finally(() => (inflight.current = false));
    if (res.ok) {
      version.current = res.version!;
      setStatus((s) => (s === "saving" ? "saved" : s));
    } else {
      pending.current = { ...patch, ...pending.current }; // keep the edit so the next save retries it
      if (res.conflict) conflict.current = true;
      setStatus({ error: res.error, conflict: res.conflict });
    }
  }
  function queue(patch: { title?: string; content?: string }) {
    pending.current = { ...pending.current, ...patch };
    if (conflict.current) return;
    setStatus("unsaved");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }

  // Someone else saved: tell the user before they type. Skipped while our own save is in flight or unsent.
  useEffect(() => {
    if (!presence || !canEdit || conflict.current || inflight.current) return;
    if (presence.version <= version.current || pending.current.title !== undefined || pending.current.content !== undefined) return;
    conflict.current = true;
    setStatus({ error: NEWER, conflict: true });
  }, [presence, canEdit]);

  const editor = useEditor({
    // Covers everything the importers emit: Markdown/.docx tables, task lists, links, images (.docx embeds them as data URIs).
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TableKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true }),
      Markdown,
      ...(canEdit ? [Placeholder.configure({ placeholder: "Start writing…" })] : []),
    ],
    content: props.initialContent,
    editable: canEdit,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: "tiptap min-h-[45vh] px-5 pt-7 pb-14 sm:min-h-[60vh] sm:px-16 sm:pt-12 sm:pb-24 focus:outline-none" } },
    onUpdate: ({ editor }) => queue({ content: editor.getHTML() }),
  });

  // Flush on tab close / navigation away so the last edits aren't lost.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      // Only prompt while edits are unsent or a save is still in flight.
      if (pending.current.title !== undefined || pending.current.content !== undefined || inflight.current) {
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

  function downloadMarkdown() {
    if (!editor) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([editor.getMarkdown()], { type: "text/markdown" }));
    a.download = `${title.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim().slice(0, 100) || "document"}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0); // revoking synchronously can cancel the download in some browsers
  }
  // The suggested PDF filename comes from document.title, so swap it in while the print dialog is open.
  function exportPdf() {
    const prev = document.title;
    document.title = title.trim() || prev;
    window.addEventListener("afterprint", () => (document.title = prev), { once: true });
    window.print();
  }

  return (
    <div className="min-w-0">
      <div className="print-area">
      {/* Inputs don't wrap in print, so the PDF uses this heading for the title instead. */}
      <h1 className="print-title sr-only print:not-sr-only">{title}</h1>
      {/* Title sits on the desk above the sheet, so the toolbar only governs the body. */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 sm:mb-5">
        <input
          value={title}
          readOnly={!canEdit}
          aria-label="Document title"
          data-no-print
          maxLength={200}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) queue({ title: e.target.value });
          }}
          onBlur={() => !title.trim() && setTitle(props.initialTitle)}
          className="-mx-2 min-w-0 flex-[1_1_100%] border border-transparent bg-transparent px-2 py-1 text-[clamp(1.875rem,4.5vw,3rem)] leading-[1.05] font-extrabold tracking-[-.035em] read-only:cursor-default hover:border-divider read-only:hover:border-transparent focus-visible:border-accent focus-visible:outline-offset-0 sm:flex-1"
        />
        {/* Status, presence and actions share one centered row so their text lines up. */}
        <span className="no-print flex flex-wrap items-center gap-x-4 gap-y-2 pb-1">
          <SaveStatus status={canEdit ? status : presence && presence.version > props.initialVersion ? { error: NEWER, conflict: true } : "readonly"} />
          <PresenceList viewers={presence?.viewers ?? []} />
          <span className="flex shrink-0 gap-2">
            <button type="button" className={btnSecondary} onClick={downloadMarkdown} disabled={!editor}>Download .md</button>
            <button type="button" className={btnSecondary} onClick={exportPdf}>Export PDF</button>
          </span>
        </span>
      </div>
      {/* The document body as a sheet of paper on the desk. */}
      <article className="sheet-in bg-paper shadow-paper">
        {canEdit && editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} className="[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-neutral-700 [&_.is-editor-empty:first-child]:before:italic [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]" />
      </article>
      </div>
    </div>
  );
}

function SaveStatus({ status }: { status: Status | "readonly" }) {
  // Fixed-width slot on desktop so the title doesn't jump as the status text changes.
  const slot = "text-xs leading-[1.35] sm:w-[180px] sm:shrink-0 sm:text-right";
  if (status === "readonly")
    return (
      <span className={`${slot} sm:flex sm:justify-end`}>
        <span className="inline-flex border border-neutral-400 bg-neutral-200 px-2.5 py-[3px] text-[11px] font-semibold whitespace-nowrap text-neutral-800">View only</span>
      </span>
    );
  if (typeof status === "object" && status.conflict)
    return (
      <span className="flex items-center gap-3 text-xs leading-[1.35] font-semibold text-danger" role="alert">
        <span className="max-w-[17rem] sm:text-right">{status.error}</span>
        <button type="button" className={btnSecondary} onClick={() => location.reload()}>Reload</button>
      </span>
    );
  if (typeof status === "object") return <span className={`${slot} font-semibold text-danger`} role="alert">Save failed: {status.error}</span>;
  const label = { saved: "All changes saved", unsaved: "Unsaved changes…", saving: "Saving…" }[status];
  return <span className={`${slot} text-neutral-700`} role="status">{label}</span>;
}

const noop = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" aria-hidden="true" className="mx-auto">
    <path d={d} />
  </svg>
);
const UNDO = <Icon d="M6 3 2.5 6.5 6 10M3 6.5h6.5a4 4 0 0 1 0 8H7" />;
const REDO = <Icon d="M10 3l3.5 3.5L10 10M13 6.5H6.5a4 4 0 0 0 0 8H9" />;

type Btn = [label: React.ReactNode, name: string, onClick: () => void, active: boolean, disabled?: boolean, shortcut?: string];

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const chain = () => editor.chain().focus();
  const mac = useSyncExternalStore(noop, isMac, () => false);
  const [rove, setRove] = useState("Bold");
  const ref = useRef<HTMLDivElement>(null);
  const groups: Btn[][] = [
    [
      ["B", "Bold", () => chain().toggleBold().run(), editor.isActive("bold"), false, "B"],
      ["I", "Italic", () => chain().toggleItalic().run(), editor.isActive("italic"), false, "I"],
      ["U", "Underline", () => chain().toggleUnderline().run(), editor.isActive("underline"), false, "U"],
    ],
    [
      ["H1", "Heading 1", () => chain().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 })],
      ["H2", "Heading 2", () => chain().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 })],
      ["H3", "Heading 3", () => chain().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 })],
    ],
    [
      ["• List", "Bulleted list", () => chain().toggleBulletList().run(), editor.isActive("bulletList")],
      ["1. List", "Numbered list", () => chain().toggleOrderedList().run(), editor.isActive("orderedList")],
    ],
    [
      [UNDO, "Undo", () => chain().undo().run(), false, !editor.can().undo(), "Z"],
      [REDO, "Redo", () => chain().redo().run(), false, !editor.can().redo(), "⇧Z"],
    ],
  ];
  const all = groups.flat();
  // Roving tabindex: the remembered button, or the first enabled one if it is disabled.
  const tabStop = all.find((b) => b[1] === rove && !b[4])?.[1] ?? all.find((b) => !b[4])?.[1];

  function onKeyDown(e: KeyboardEvent) {
    const els = [...ref.current!.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
    const i = els.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const next = { ArrowRight: (i + 1) % els.length, ArrowLeft: (i - 1 + els.length) % els.length, Home: 0, End: els.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    els[next].focus();
    setRove(els[next].getAttribute("aria-label")!);
  }

  return (
    <div ref={ref} onKeyDown={onKeyDown} className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-1 border-b border-divider bg-paper/95 px-2 py-1.5 backdrop-blur-sm sm:px-14 max-sm:px-3" role="toolbar" aria-label="Formatting">
      {groups.map((g, gi) => (
        <span key={gi} className="flex items-center gap-1">
          {gi > 0 && <span aria-hidden="true" className="mr-1 hidden h-5 w-px bg-divider sm:block" />}
          {g.map(([label, name, onClick, active, disabled, key]) => (
            <button
              key={name}
              type="button"
              title={key ? `${name} (${mac ? "⌘" : "Ctrl+"}${key})` : name}
              aria-label={name}
              aria-pressed={active}
              tabIndex={name === tabStop ? 0 : -1}
              disabled={disabled}
              onClick={onClick}
              onFocus={() => setRove(name)}
              className={`h-8 min-w-8 cursor-pointer px-2 text-[13px] font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45 ${
                active ? "bg-accent-100 text-accent-800 shadow-[inset_0_-2px_0_var(--color-accent)]" : "enabled:hover:bg-neutral-200"
              } ${label === "B" ? "font-extrabold" : label === "I" ? "italic" : label === "U" ? "underline" : ""}`}
            >
              {label}
            </button>
          ))}
        </span>
      ))}
    </div>
  );
}
