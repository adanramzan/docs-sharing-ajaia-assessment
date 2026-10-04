// Document + sharing domain logic. Every function takes the acting user's id and
// enforces access here, so pages/actions can't accidentally skip a check.
import { randomUUID } from "node:crypto";
import { sql } from "./db";

export type Role = "owner" | "editor" | "viewer";
export type ShareRole = Exclude<Role, "owner">;

export type DocSummary = { id: string; title: string; updated_at: Date; owner_name: string; role: Role };
export type Doc = DocSummary & { content: string; owner_id: string; version: number };
export type Share = { user_id: string; name: string; email: string; role: ShareRole };

export class AppError extends Error {}
export class ConflictError extends AppError {}
export type Presence = { viewers: { id: string; name: string }[]; version: number };

export async function listDocs(userId: string) {
  const rows = await sql<DocSummary>(
    `SELECT d.id, d.title, d.updated_at, u.name AS owner_name,
            CASE WHEN d.owner_id = $1 THEN 'owner' ELSE s.role END AS role
       FROM documents d
       JOIN users u ON u.id = d.owner_id
       LEFT JOIN shares s ON s.doc_id = d.id AND s.user_id = $1
      WHERE d.owner_id = $1 OR s.user_id = $1
      ORDER BY d.updated_at DESC`,
    [userId],
  );
  return { owned: rows.filter((r) => r.role === "owner"), shared: rows.filter((r) => r.role !== "owner") };
}

/** Returns the doc with the caller's role, or null if it doesn't exist or they have no access. */
export async function getDoc(userId: string, docId: string): Promise<Doc | null> {
  const [row] = await sql<Doc>(
    `SELECT d.id, d.title, d.content, d.owner_id, d.version, d.updated_at, u.name AS owner_name,
            CASE WHEN d.owner_id = $1 THEN 'owner' ELSE s.role END AS role
       FROM documents d
       JOIN users u ON u.id = d.owner_id
       LEFT JOIN shares s ON s.doc_id = d.id AND s.user_id = $1
      WHERE d.id = $2 AND (d.owner_id = $1 OR s.user_id = $1)`,
    [userId, docId],
  );
  return row ?? null;
}

async function requireRole(userId: string, docId: string, allowed: Role[]) {
  const doc = await getDoc(userId, docId);
  if (!doc) throw new AppError("Document not found or you don't have access.");
  if (!allowed.includes(doc.role)) throw new AppError(`Your role (${doc.role}) can't do that.`);
  return doc;
}

export async function createDoc(userId: string, title: string, content = "") {
  const id = randomUUID();
  await sql(`INSERT INTO documents (id, owner_id, title, content) VALUES ($1, $2, $3, $4)`, [id, userId, title, content]);
  return id;
}

export async function updateDoc(userId: string, docId: string, patch: { title?: string; content?: string }, baseVersion: number) {
  await requireRole(userId, docId, ["owner", "editor"]);
  const [row] = await sql<{ version: number }>(
    `UPDATE documents SET title = COALESCE($2, title), content = COALESCE($3, content), updated_at = now(), version = version + 1
      WHERE id = $1 AND version = $4 RETURNING version`,
    [docId, patch.title ?? null, patch.content ?? null, baseVersion],
  );
  if (!row) throw new ConflictError("Someone else saved a newer version. Reload to see it — your unsaved changes here will be lost.");
  return row.version;
}

// ponytail: polling presence (10s beat, 30s expiry); stale rows are never deleted, add a cleanup or move to websockets (Liveblocks/Pusher) at scale.
export async function heartbeat(userId: string, docId: string): Promise<Presence> {
  const doc = await requireRole(userId, docId, ["owner", "editor", "viewer"]);
  await sql(
    `INSERT INTO presence (doc_id, user_id) VALUES ($1, $2) ON CONFLICT (doc_id, user_id) DO UPDATE SET seen_at = now()`,
    [docId, userId],
  );
  const viewers = await sql<{ id: string; name: string }>(
    `SELECT u.id, u.name FROM presence p JOIN users u ON u.id = p.user_id
      WHERE p.doc_id = $1 AND p.user_id <> $2 AND p.seen_at > now() - interval '30 seconds' ORDER BY u.name`,
    [docId, userId],
  );
  return { viewers, version: doc.version };
}

export async function deleteDoc(userId: string, docId: string) {
  await requireRole(userId, docId, ["owner"]);
  await sql(`DELETE FROM documents WHERE id = $1`, [docId]);
}

export async function listShares(userId: string, docId: string) {
  await requireRole(userId, docId, ["owner", "editor", "viewer"]);
  return sql<Share>(
    `SELECT s.user_id, u.name, u.email, s.role FROM shares s JOIN users u ON u.id = s.user_id
      WHERE s.doc_id = $1 ORDER BY u.name`,
    [docId],
  );
}

export async function shareDoc(userId: string, docId: string, email: string, role: ShareRole) {
  const doc = await requireRole(userId, docId, ["owner"]);
  const [target] = await sql<{ id: string }>(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email.trim()]);
  if (!target) throw new AppError(`No user with email ${email}.`);
  if (target.id === doc.owner_id) throw new AppError("You already own this document.");
  await sql(
    `INSERT INTO shares (doc_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (doc_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [docId, target.id, role],
  );
}

export async function unshareDoc(userId: string, docId: string, targetUserId: string) {
  await requireRole(userId, docId, ["owner"]);
  await sql(`DELETE FROM shares WHERE doc_id = $1 AND user_id = $2`, [docId, targetUserId]);
}
