import Link from "next/link";
import { btnPrimary } from "../../ui";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-18 sm:py-24">
      <h1 className="mb-3 border-b-2 border-divider pb-3 text-[28px] sm:text-[32px]">Document not available</h1>
      <p className="mb-6 text-[15px] text-pretty text-neutral-800">
        It may have been deleted, or you don&apos;t have access. Ask the owner to share it with you.
      </p>
      <Link href="/" className={btnPrimary}>
        ← Back to all documents
      </Link>
    </main>
  );
}
