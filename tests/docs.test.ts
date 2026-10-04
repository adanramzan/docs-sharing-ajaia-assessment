// Exercises the real SQL against an in-memory PGlite Postgres: ownership, sharing, roles, import.
import { beforeAll, describe, expect, it } from "vitest";

process.env.PGLITE_DIR = "memory://";
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
const docs = await import("../src/lib/docs");
const { fileToHtml } = await import("../src/lib/import");

describe("sharing & access control", () => {
  let id: string;
  beforeAll(async () => {
    id = await docs.createDoc("alice", "Plan", "<p>secret</p>");
  });

  it("owner sees the doc under owned; others can't see or edit it", async () => {
    expect((await docs.listDocs("alice")).owned.map((d) => d.id)).toContain(id);
    expect(await docs.getDoc("bob", id)).toBeNull();
    await expect(docs.updateDoc("bob", id, { content: "<p>hacked</p>" })).rejects.toThrow(/not found/);
  });

  it("viewer can read but not edit or reshare", async () => {
    await docs.shareDoc("alice", id, "BOB@ajaia.test", "viewer");
    const { shared, owned } = await docs.listDocs("bob");
    expect(owned).toHaveLength(0);
    expect(shared).toMatchObject([{ id, role: "viewer", owner_name: "Alice Chen" }]);
    await expect(docs.updateDoc("bob", id, { title: "x" })).rejects.toThrow(/viewer/);
    await expect(docs.shareDoc("bob", id, "carol@ajaia.test", "editor")).rejects.toThrow(/viewer/);
  });

  it("upgrading to editor allows edits that persist with formatting", async () => {
    await docs.shareDoc("alice", id, "bob@ajaia.test", "editor");
    await docs.updateDoc("bob", id, { content: "<h1>Hi</h1><p><strong>bold</strong></p>" });
    expect((await docs.getDoc("alice", id))?.content).toBe("<h1>Hi</h1><p><strong>bold</strong></p>");
  });

  it("rejects unknown users and sharing with the owner; revoking removes access", async () => {
    await expect(docs.shareDoc("alice", id, "nobody@x.com", "viewer")).rejects.toThrow(/No user/);
    await expect(docs.shareDoc("alice", id, "alice@ajaia.test", "viewer")).rejects.toThrow(/own/);
    await docs.unshareDoc("alice", id, "bob");
    expect(await docs.getDoc("bob", id)).toBeNull();
  });
});

describe("file import", () => {
  it("converts markdown and escapes plain text", async () => {
    expect((await fileToHtml("notes.md", Buffer.from("# Title\n\n- a"))).html).toMatch(/<h1>Title<\/h1>[\s\S]*<li>a<\/li>/);
    const txt = await fileToHtml("raw.txt", Buffer.from("<script>x</script>\n\nline2"));
    expect(txt).toEqual({ title: "raw", html: "<p>&lt;script&gt;x&lt;/script&gt;</p><p>line2</p>" });
  });

  it("rejects unsupported or empty files", async () => {
    await expect(fileToHtml("a.pdf", Buffer.from("x"))).rejects.toThrow(/Unsupported/);
    await expect(fileToHtml("a.txt", Buffer.alloc(0))).rejects.toThrow(/empty/);
  });
});
