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
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <nav className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <Link href="/" className="hover:underline">
          ← All documents
        </Link>
        <span>
          Signed in as {user.name} · <span className="font-medium">{doc.role}</span>
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
