// Single Postgres database (Neon, provisioned via Vercel) used by local dev, tests, and production.
import { Pool } from "pg";

type Row = Record<string, unknown>;
export type Query = <T = Row>(sql: string, params?: unknown[]) => Promise<T[]>;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE
   )`,
  `CREATE TABLE IF NOT EXISTS documents (
     id TEXT PRIMARY KEY,
     owner_id TEXT NOT NULL REFERENCES users(id),
     title TEXT NOT NULL,
     content TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS shares (
     doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
     user_id TEXT NOT NULL REFERENCES users(id),
     role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
     PRIMARY KEY (doc_id, user_id)
   )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
  // int version, not updated_at: JS Date drops Postgres microseconds so timestamp equality would never match
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS presence (
     doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
     user_id TEXT NOT NULL REFERENCES users(id),
     seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (doc_id, user_id)
   )`,
];

export const SEED_USERS = [
  { id: "alice", name: "Alice Chen", email: "alice@ajaia.test" },
  { id: "bob", name: "Bob Patel", email: "bob@ajaia.test" },
  { id: "carol", name: "Carol Diaz", email: "carol@ajaia.test" },
];

async function connect(): Promise<Query> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy it from Vercel → Storage into .env.local.");
  const pool = new Pool({ connectionString: url, max: 3 });
  const query: Query = async (sql, params = []) => (await pool.query(sql, params)).rows;
  for (const stmt of SCHEMA) await query(stmt);
  for (const u of SEED_USERS) {
    await query(`INSERT INTO users (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`, [
      u.id,
      u.name,
      u.email,
    ]);
  }
  return query;
}

// Cache on globalThis so dev hot-reloads reuse one pool and run schema setup once.
const g = globalThis as unknown as { __db?: Promise<Query> };

export const sql: Query = async (text, params) => {
  g.__db ??= connect().catch((e) => {
    g.__db = undefined;
    throw e;
  });
  return (await g.__db)(text, params);
};
