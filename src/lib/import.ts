// Turns an uploaded file into editor HTML. The editor's schema drops any tag it
// doesn't support when loading, so unknown/unsafe markup never reaches the page.
import mammoth from "mammoth";
import { Marked } from "marked";
import { AppError } from "./docs";

export const ACCEPTED = [".txt", ".md", ".docx"];
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// GFM task lists ("- [x] done") → the markup Tiptap's TaskList/TaskItem parse; other lists render as usual.
const marked = new Marked({
  renderer: {
    list(token) {
      if (!token.items.some((i) => i.task)) return false;
      const items = token.items.map(
        (i) => `<li data-type="taskItem" data-checked="${!!i.checked}">${this.parser.parse(i.tokens.filter((t) => t.type !== "checkbox"))}</li>`,
      );
      return `<ul data-type="taskList">${items.join("")}</ul>`;
    },
  },
});

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function fileToHtml(name: string, data: Buffer): Promise<{ title: string; html: string }> {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  if (!ACCEPTED.includes(ext)) throw new AppError(`Unsupported file type "${ext}". Use ${ACCEPTED.join(", ")}.`);
  if (data.length > MAX_UPLOAD_BYTES) throw new AppError("File is larger than 4MB.");
  if (data.length === 0) throw new AppError("File is empty.");

  const title = name.slice(0, name.lastIndexOf(".")).trim() || "Imported document";
  let html: string;
  if (ext === ".docx") {
    html = (await mammoth.convertToHtml({ buffer: data })).value;
  } else {
    const text = data.toString("utf8");
    html =
      ext === ".md"
        ? await marked.parse(text)
        : text
            .split(/\r?\n\s*\r?\n/)
            .map((p) => `<p>${escape(p).replace(/\r?\n/g, "<br>")}</p>`)
            .join("");
  }
  return { title: title.slice(0, 200), html };
}
