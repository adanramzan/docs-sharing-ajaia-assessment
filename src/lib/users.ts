import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { sql } from "./db";
import { AppError } from "./docs";

const kdf = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function createUser(name: string, email: string, password: string): Promise<string> {
  const id = randomUUID();
  const salt = randomBytes(16);
  const hash = `${salt.toString("hex")}:${(await kdf(password, salt, 64)).toString("hex")}`;
  try {
    await sql(`INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)`, [
      id,
      name,
      email.toLowerCase(),
      hash,
    ]);
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new AppError("An account with that email already exists.");
    throw e;
  }
  return id;
}

export async function verifyUser(email: string, password: string): Promise<string | null> {
  const [u] = await sql<{ id: string; password_hash: string | null }>(
    `SELECT id, password_hash FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );
  if (!u?.password_hash) return null;
  const [salt, hash] = u.password_hash.split(":");
  const want = Buffer.from(hash, "hex");
  const got = await kdf(password, Buffer.from(salt, "hex"), 64);
  return want.length === got.length && timingSafeEqual(want, got) ? u.id : null;
}
