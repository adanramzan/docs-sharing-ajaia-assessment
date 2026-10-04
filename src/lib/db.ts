// One tiny query function over two backends:
// - Postgres (Neon via Vercel) when DATABASE_URL / POSTGRES_URL is set (production)
// - Embedded PGlite (real Postgres compiled to WASM) otherwise, so local dev and tests need zero setup.
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
];

export const SEED_USERS = [
  { id: "alice", name: "Alice Chen", email: "alice@ajaia.test" },
  { id: "bob", name: "Bob Patel", email: "bob@ajaia.test" },
  { id: "carol", name: "Carol Diaz", email: "carol@ajaia.test" },
];

async function connect(): Promise<Query> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  let query: Query;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 3 });
    query = async (sql, params = []) => (await pool.query(sql, params)).rows;
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
    if (!dir.includes("://")) (await import("node:fs")).mkdirSync(dir, { recursive: true });
    const db = new PGlite(dir);
    query = async <T,>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;
  }
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

// Cache on globalThis so dev hot-reloads don't open a second PGlite on the same directory.
const g = globalThis as unknown as { __db?: Promise<Query> };

export const sql: Query = async (text, params) => {
  g.__db ??= connect().catch((e) => {
    g.__db = undefined;
    throw e;
  });
  return (await g.__db)(text, params);
};
