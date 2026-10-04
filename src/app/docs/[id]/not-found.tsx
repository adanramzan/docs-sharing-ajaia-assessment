import Link from "next/link";
import { btnPrimary, Dot, Masthead } from "../../ui";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[96rem] px-4 pt-5 pb-20 sm:px-6 lg:px-10">
      <Masthead>
        <span />
      </Masthead>
      <div className="max-w-xl py-16 sm:py-24">
        <h1 className="mb-5 text-[clamp(2.25rem,6vw,3.75rem)] leading-[.95] font-extrabold tracking-[-.04em] text-balance reveal">
          Document not available<Dot />
        </h1>
        <p className="mb-8 font-serif text-lg text-pretty text-neutral-800">
          It may have been deleted, or you don&apos;t have access. Ask the owner to share it with you.
        </p>
        <Link href="/" className={btnPrimary}>
          ← Back to all documents
        </Link>
      </div>
    </main>
  );
}
