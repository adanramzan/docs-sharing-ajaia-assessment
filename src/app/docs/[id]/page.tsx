import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SEED_USERS } from "@/lib/db";
import { getDoc, listShares } from "@/lib/docs";
import { Editor } from "./editor";
import { SharePanel } from "./share-panel";
import { logout } from "../../actions";
import { SubmitButton } from "../../submit-button";
import { btnSecondary, Masthead } from "../../ui";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: PageProps<"/docs/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const doc = await getDoc(user.id, id);
  if (!doc) notFound();
  const shares = await listShares(user.id, id);

  return (
    <main className="mx-auto w-full max-w-[96rem] px-4 pt-5 pb-20 sm:px-6 lg:px-10">
      <Masthead>
        <form action={logout} className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-neutral-800">
            Signed in as {user.name} · <strong className="text-text">{doc.role}</strong>
            {doc.role !== "owner" && <> · owned by {doc.owner_name}</>}
          </span>
          <SubmitButton className={btnSecondary} pendingText="Signing out…">Sign out</SubmitButton>
        </form>
      </Masthead>
      <Link href="/" className="mt-4 mb-6 inline-block text-sm font-semibold hover:text-accent-700 hover:underline sm:mb-8">
        ← All documents
      </Link>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-14">
        <Editor docId={doc.id} initialTitle={doc.title} initialContent={doc.content} canEdit={doc.role !== "viewer"} />
        <SharePanel docId={doc.id} isOwner={doc.role === "owner"} ownerName={doc.owner_name} shares={shares}
          userEmails={SEED_USERS.map((u) => u.email).filter((e) => e !== user.email)}
        />
      </div>
    </main>
  );
}
