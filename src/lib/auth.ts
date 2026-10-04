// Auth: seeded users log in with one click; signed-up users with email + password (lib/users.ts). Either way we store the id in an httpOnly cookie.
// ponytail: unsigned cookie, no expiry/reset/rate limiting; sign the cookie or swap for NextAuth/Clerk before any real use.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";

export type User = { id: string; name: string; email: string };

export async function currentUser(): Promise<User | null> {
  const id = (await cookies()).get("uid")?.value;
  if (!id) return null;
  const [user] = await sql<User>(`SELECT id, name, email FROM users WHERE id = $1`, [id]);
  return user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}
