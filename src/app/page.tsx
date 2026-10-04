import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { SEED_USERS } from "@/lib/db";
import { listDocs, type DocSummary } from "@/lib/docs";
import { createDocument, login, logout } from "./actions";
import { SubmitButton } from "./submit-button";
import { UploadForm } from "./upload-form";
import { btnPrimary, btnSecondary, RolePill } from "./ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  if (!user) return <Login />;
  const { owned, shared } = await listDocs(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-6 sm:pt-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-divider pb-4 sm:mb-8 sm:gap-4">
        <h1 className="text-2xl whitespace-nowrap">Ajaia Docs</h1>
        <form action={logout} className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span>
            {user.name} <span className="text-neutral-700">({user.email})</span>
          </span>
          <SubmitButton className={btnSecondary}>Switch user</SubmitButton>
        </form>
      </header>

      <section className="mb-8 flex flex-wrap items-start gap-4 sm:mb-10 sm:gap-6">
        <form action={createDocument}>
          <SubmitButton className={btnPrimary} pendingText="Creating…">
            + New document
          </SubmitButton>
        </form>
        <UploadForm />
      </section>

      <DocList title="My documents" docs={owned} empty="No documents yet. Create one or import a file." />
      <DocList title="Shared with me" docs={shared} empty="Nothing has been shared with you yet." />
    </main>
  );
}

function DocList({ title, docs, empty }: { title: string; docs: DocSummary[]; empty: string }) {
  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="mb-2.5 text-xs leading-none font-semibold tracking-[.08em] text-neutral-700 uppercase">{title}</h2>
      {docs.length === 0 ? (
        <p className="border border-dashed border-neutral-600 px-4 py-6 text-sm text-neutral-700">{empty}</p>
      ) : (
        <ul className="border-t-2 border-divider">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/docs/${d.id}`}
                className="flex items-center justify-between gap-3 border-b border-divider px-1 py-3 hover:bg-text/5 focus-visible:outline-offset-[-2px] sm:gap-4 sm:px-2"
              >
                <span className="min-w-0 truncate font-semibold">{d.title}</span>
                <span className="flex shrink-0 items-center gap-2.5 text-xs whitespace-nowrap text-neutral-700 tabular-nums">
                  {d.role !== "owner" && <RolePill role={d.role}>{d.owner_name} · {d.role}</RolePill>}
                  <span className="hidden sm:inline">{new Date(d.updated_at).toLocaleString()}</span>
                  {d.role === "owner" && (
                    <span className="sm:hidden">{new Date(d.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Login() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-24">
      <h1 className="mb-2 text-[32px]">Ajaia Docs</h1>
      <p className="mb-6 text-sm text-neutral-700">Demo login: pick a seeded account. Use two accounts to try sharing.</p>
      <div className="border-t-2 border-divider">
        {SEED_USERS.map((u) => (
          <form key={u.id} action={login}>
            <input type="hidden" name="userId" value={u.id} />
            <SubmitButton className="block w-full cursor-pointer border-b border-divider px-3 py-3.5 disabled:cursor-wait disabled:opacity-60 text-left hover:bg-text/7 focus-visible:outline-offset-[-2px] active:bg-text/14 active:shadow-[inset_3px_0_0_var(--color-accent-700)]">
              <span className="text-[15px] font-semibold">{u.name}</span>
              <span className="block text-xs text-neutral-700">{u.email}</span>
            </SubmitButton>
          </form>
        ))}
      </div>
    </main>
  );
}
