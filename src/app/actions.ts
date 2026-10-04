"use server";
// Server actions: validate input at the trust boundary, then delegate to lib/docs (which enforces access).
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { SEED_USERS } from "@/lib/db";
import * as docs from "@/lib/docs";
import { fileToHtml } from "@/lib/import";
import { createUser, verifyUser } from "@/lib/users";

export type Result = { ok: true } | { ok: false; error: string };

const title = z.string().trim().min(1, "Title can't be empty.").max(200, "Title is too long.");
const content = z.string().max(2_000_000, "Document is too large.");

async function run(fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof docs.AppError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0].message };
    console.error(e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

async function setSession(id: string) {
  (await cookies()).set("uid", id, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function login(formData: FormData) {
  const id = String(formData.get("userId"));
  if (!SEED_USERS.some((u) => u.id === id)) return;
  await setSession(id);
  redirect("/");
}

const email = z.email("Enter a valid email.");

export async function signup(_: Result | null, formData: FormData): Promise<Result> {
  let id = "";
  const res = await run(async () => {
    const f = z
      .object({
        name: z.string().trim().min(1, "Enter your name.").max(80, "Name is too long."),
        email,
        password: z.string().min(8, "Password must be at least 8 characters.").max(200, "Password is too long."),
      })
      .parse(Object.fromEntries(formData));
    id = await createUser(f.name, f.email, f.password);
  });
  if (res.ok) {
    await setSession(id);
    redirect("/");
  }
  return res;
}

export async function signin(_: Result | null, formData: FormData): Promise<Result> {
  let id = "";
  const res = await run(async () => {
    const f = z
      .object({ email, password: z.string().min(1, "Enter your password.") })
      .parse(Object.fromEntries(formData));
    const uid = await verifyUser(f.email, f.password);
    if (!uid) throw new docs.AppError("Wrong email or password.");
    id = uid;
  });
  if (res.ok) {
    await setSession(id);
    redirect("/");
  }
  return res;
}

export async function logout() {
  (await cookies()).delete("uid");
  redirect("/");
}

export async function createDocument() {
  const user = await requireUser();
  const id = await docs.createDoc(user.id, "Untitled document");
  redirect(`/docs/${id}`);
}

export async function uploadDocument(_: Result | null, formData: FormData): Promise<Result> {
  const user = await requireUser();
  let id = "";
  const res = await run(async () => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new docs.AppError("Choose a file to upload.");
    const { title, html } = await fileToHtml(file.name, Buffer.from(await file.arrayBuffer()));
    id = await docs.createDoc(user.id, title, html);
  });
  if (res.ok) redirect(`/docs/${id}`);
  return res;
}

export async function saveDocument(docId: string, patch: { title?: string; content?: string }): Promise<Result> {
  const user = await requireUser();
  return run(async () => {
    await docs.updateDoc(user.id, docId, {
      title: patch.title === undefined ? undefined : title.parse(patch.title),
      content: patch.content === undefined ? undefined : content.parse(patch.content),
    });
    revalidatePath("/");
  });
}

export async function deleteDocument(docId: string) {
  const user = await requireUser();
  await docs.deleteDoc(user.id, docId);
  redirect("/");
}

export type ShareResult = Result & { email: string; role: string };

export async function shareDocument(docId: string, _: ShareResult | null, formData: FormData): Promise<ShareResult> {
  const user = await requireUser();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "editor");
  const res = await run(async () => {
    const e = z.email("Enter a valid email.").parse(email);
    const r = z.enum(["viewer", "editor"]).parse(role);
    await docs.shareDoc(user.id, docId, e, r);
    revalidatePath(`/docs/${docId}`);
  });
  return { ...res, email, role };
}

export async function unshareDocument(docId: string, targetUserId: string): Promise<Result> {
  const user = await requireUser();
  return run(async () => {
    await docs.unshareDoc(user.id, docId, targetUserId);
    revalidatePath(`/docs/${docId}`);
  });
}
