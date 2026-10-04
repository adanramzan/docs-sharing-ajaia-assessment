// Exercises the real SQL against the app's Postgres (DATABASE_URL from .env.local):
// ownership, sharing, roles, import. Creates its own document and deletes it afterwards.
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "../src/lib/db";
import * as docs from "../src/lib/docs";
import { fileToHtml } from "../src/lib/import";

describe("sharing & access control", () => {
  let id: string;
  beforeAll(async () => {
    id = await docs.createDoc("alice", "[test] Plan", "<p>secret</p>");
  });
  afterAll(async () => {
    await docs.deleteDoc("alice", id);
  });

  it("owner sees the doc under owned; others can't see or edit it", async () => {
    expect((await docs.listDocs("alice")).owned.map((d) => d.id)).toContain(id);
    expect((await docs.listDocs("bob")).shared.map((d) => d.id)).not.toContain(id);
    expect(await docs.getDoc("bob", id)).toBeNull();
    await expect(docs.updateDoc("bob", id, { content: "<p>hacked</p>" }, 0)).rejects.toThrow(/not found/);
  });

  it("viewer can read but not edit or reshare", async () => {
    await docs.shareDoc("alice", id, "BOB@ajaia.test", "viewer");
    const { shared, owned } = await docs.listDocs("bob");
    expect(owned.map((d) => d.id)).not.toContain(id);
    expect(shared.find((d) => d.id === id)).toMatchObject({ role: "viewer", owner_name: "Alice Chen" });
    await expect(docs.updateDoc("bob", id, { title: "x" }, 0)).rejects.toThrow(/viewer/);
    await expect(docs.shareDoc("bob", id, "carol@ajaia.test", "editor")).rejects.toThrow(/viewer/);
  });

  it("upgrading to editor allows edits that persist with formatting", async () => {
    await docs.shareDoc("alice", id, "bob@ajaia.test", "editor");
    await docs.updateDoc("bob", id, { content: "<h1>Hi</h1><p><strong>bold</strong></p>" }, 0);
    expect((await docs.getDoc("alice", id))?.content).toBe("<h1>Hi</h1><p><strong>bold</strong></p>");
  });

  it("rejects unknown users and sharing with the owner; revoking removes access", async () => {
    await expect(docs.shareDoc("alice", id, "nobody@x.com", "viewer")).rejects.toThrow(/No user/);
    await expect(docs.shareDoc("alice", id, "alice@ajaia.test", "viewer")).rejects.toThrow(/own/);
    await docs.unshareDoc("alice", id, "bob");
    expect(await docs.getDoc("bob", id)).toBeNull();
  });
});

describe("save conflicts & presence", () => {
  let id: string;
  beforeAll(async () => {
    id = await docs.createDoc("alice", "[test] Conflict", "");
    await docs.shareDoc("alice", id, "bob@ajaia.test", "viewer");
  });
  afterAll(async () => {
    await docs.deleteDoc("alice", id);
  });

  it("rejects a stale save", async () => {
    await docs.shareDoc("alice", id, "bob@ajaia.test", "editor");
    expect(await docs.updateDoc("alice", id, { content: "<p>a</p>" }, 0)).toBe(1);
    await expect(docs.updateDoc("bob", id, { content: "<p>b</p>" }, 0)).rejects.toThrow(docs.ConflictError);
    expect((await docs.getDoc("alice", id))?.content).toBe("<p>a</p>");
    expect(await docs.updateDoc("bob", id, { content: "<p>b</p>" }, 1)).toBe(2);
  });

  it("presence lists other active users only, never strangers", async () => {
    await docs.shareDoc("alice", id, "bob@ajaia.test", "viewer");
    const v = (await docs.getDoc("alice", id))!.version;
    expect(await docs.heartbeat("bob", id)).toMatchObject({ viewers: [], version: v });
    expect(await docs.heartbeat("alice", id)).toEqual({ viewers: [{ id: "bob", name: "Bob Patel" }], version: v });
    expect((await docs.heartbeat("bob", id)).viewers.map((x) => x.id)).toEqual(["alice"]);
    await expect(docs.heartbeat("carol", id)).rejects.toThrow(/not found/);
    await sql(`UPDATE presence SET seen_at = now() - interval '1 minute' WHERE user_id = 'bob'`);
    expect((await docs.heartbeat("alice", id)).viewers).toEqual([]);
  });
});

describe("file import", () => {
  it("converts markdown and escapes plain text", async () => {
    expect((await fileToHtml("notes.md", Buffer.from("# Title\n\n- a"))).html).toMatch(/<h1>Title<\/h1>[\s\S]*<li>a<\/li>/);
    const txt = await fileToHtml("raw.txt", Buffer.from("<script>x</script>\n\nline2"));
    expect(txt).toEqual({ title: "raw", html: "<p>&lt;script&gt;x&lt;/script&gt;</p><p>line2</p>" });
  });

  it("keeps GFM tables and task lists in a shape the editor can load", async () => {
    const { html } = await fileToHtml("all.md", readFileSync("tests/fixtures/all-formatting.md"));
    expect(html).toMatch(/<table>[\s\S]*<td>Tables render<\/td>/);
    expect(html).toContain('<ul data-type="taskList"><li data-type="taskItem" data-checked="true">Done task</li>');
    expect(html).toContain('data-checked="false">Open task');
  });

  it("rejects unsupported or empty files", async () => {
    await expect(fileToHtml("a.pdf", Buffer.from("x"))).rejects.toThrow(/Unsupported/);
    await expect(fileToHtml("a.txt", Buffer.alloc(0))).rejects.toThrow(/empty/);
  });
});
