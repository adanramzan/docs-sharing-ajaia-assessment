// Email+password sign-up against the real Postgres; cleans up its own user and doc.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as docs from "../src/lib/docs";
import { sql } from "../src/lib/db";
import { createUser, verifyUser } from "../src/lib/users";

const email = `test-${Date.now()}@ajaia.test`;

describe("sign-up", () => {
  let uid: string;
  let docId: string;
  beforeAll(async () => {
    uid = await createUser("Test User", email, "hunter2hunter2");
    docId = await docs.createDoc("alice", "[test] signup share");
  });
  afterAll(async () => {
    await docs.deleteDoc("alice", docId);
    await sql(`DELETE FROM shares WHERE user_id=$1`, [uid]);
    await sql(`DELETE FROM users WHERE id=$1`, [uid]);
  });

  it("verifies the right password only", async () => {
    expect(await verifyUser(email, "hunter2hunter2")).toBe(uid);
    expect(await verifyUser(email.toUpperCase(), "hunter2hunter2")).toBe(uid);
    expect(await verifyUser(email, "wrong-password")).toBeNull();
  });

  it("rejects duplicate emails regardless of case", async () => {
    await expect(createUser("Dup", email.toUpperCase(), "hunter2hunter2")).rejects.toThrow(/already exists/);
  });

  it("seeded users have no password login", async () => {
    expect(await verifyUser("alice@ajaia.test", "anything")).toBeNull();
  });

  it("a signed-up user can receive a share", async () => {
    await docs.shareDoc("alice", docId, email, "viewer");
    expect((await docs.listDocs(uid)).shared.map((d) => d.id)).toContain(docId);
  });
});
