// Mocked auth: the user picks a seeded account and we store its id in an httpOnly cookie.
// ponytail: no passwords/sessions; swap for NextAuth/Clerk before any real use.
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
