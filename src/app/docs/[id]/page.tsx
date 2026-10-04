import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SEED_USERS } from "@/lib/db";
import { getDoc, listShares } from "@/lib/docs";
import { Editor } from "./editor";
import { SharePanel } from "./share-panel";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: PageProps<"/docs/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const doc = await getDoc(user.id, id);
  if (!doc) notFound();
  const shares = await listShares(user.id, id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-8 sm:pt-6">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b-2 border-divider pb-3 text-sm sm:mb-6">
        <Link href="/" className="font-semibold hover:text-accent-700 hover:underline">
          ← All documents
        </Link>
        <span className="text-neutral-800">
          Signed in as {user.name} · <strong className="text-text">{doc.role}</strong>
          {doc.role !== "owner" && <> · owned by {doc.owner_name}</>}
        </span>
      </nav>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Editor docId={doc.id} initialTitle={doc.title} initialContent={doc.content} canEdit={doc.role !== "viewer"} />
        <SharePanel docId={doc.id} isOwner={doc.role === "owner"} ownerName={doc.owner_name} shares={shares}
          userEmails={SEED_USERS.map((u) => u.email).filter((e) => e !== user.email)}
        />
      </div>
    </main>
  );
}
