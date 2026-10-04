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

export async function login(formData: FormData) {
  const id = String(formData.get("userId"));
  if (!SEED_USERS.some((u) => u.id === id)) return;
  (await cookies()).set("uid", id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/");
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

export async function shareDocument(docId: string, _: Result | null, formData: FormData): Promise<Result> {
  const user = await requireUser();
  return run(async () => {
    const email = z.email("Enter a valid email.").parse(String(formData.get("email") ?? "").trim());
    const role = z.enum(["viewer", "editor"]).parse(formData.get("role"));
    await docs.shareDoc(user.id, docId, email, role);
    revalidatePath(`/docs/${docId}`);
  });
}

export async function unshareDocument(docId: string, targetUserId: string) {
  const user = await requireUser();
  await docs.unshareDoc(user.id, docId, targetUserId);
  revalidatePath(`/docs/${docId}`);
}
