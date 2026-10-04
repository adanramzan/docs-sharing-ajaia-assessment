import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { SEED_USERS } from "@/lib/db";
import { listDocs, type DocSummary } from "@/lib/docs";
import { createDocument, login, logout } from "./actions";
import { AuthForms } from "./auth-forms";
import { LinkLoader } from "./link-loader";
import { SubmitButton } from "./submit-button";
import { UploadForm } from "./upload-form";
import { btnPrimary, btnSecondary, display, Dot, Kicker, Masthead, RolePill, stagger } from "./ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  if (!user) return <Login />;
  const { owned, shared } = await listDocs(user.id);

  return (
    <main className="mx-auto w-full max-w-[96rem] px-4 pt-5 pb-20 sm:px-6 lg:px-10">
      <Masthead>
        <form action={logout} className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>
            <span className="font-semibold">{user.name}</span> <span className="text-neutral-700">({user.email})</span>
          </span>
          <SubmitButton className={btnSecondary} pendingText="Signing out…">Sign out</SubmitButton>
        </form>
      </Masthead>

      <section className="mt-8 mb-10 flex flex-wrap items-start justify-between gap-x-8 gap-y-5 sm:mt-12 sm:mb-12">
        <h1 className={`${display} reveal`}>
          Your documents
          <Dot />
        </h1>
        <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
          <form action={createDocument}>
            <SubmitButton className={`${btnPrimary} py-2`} pendingText="Creating…">
              + New document
            </SubmitButton>
          </form>
          <UploadForm />
        </div>
      </section>

      <div className="grid gap-12 sm:gap-16 xl:grid-cols-2 xl:gap-x-12">
        <DocList title="My documents" docs={owned} empty="No documents yet. Create one or import a file." />
        <DocList title="Shared with me" docs={shared} empty="Nothing has been shared with you yet." />
      </div>
    </main>
  );
}

// "Oct 5, 14:02" — compact and consistent; rendered on the server, so it uses the server's timezone.
const stamp = (d: string | Date) =>
  new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const day = (d: string | Date) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function DocList({ title, docs, empty }: { title: string; docs: DocSummary[]; empty: string }) {
  return (
    <section>
      <div className="mb-3">
        <Kicker count={docs.length}>{title}</Kicker>
      </div>
      {docs.length === 0 ? (
        <p className="border-y-2 border-text py-8 font-serif text-lg text-neutral-700 italic">{empty}</p>
      ) : (
        <ol className="border-t-2 border-text">
          {docs.map((d, i) => (
            <li key={d.id} className="rise relative" style={stagger(i)}>
              <Link href={`/docs/${d.id}`} className="group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-divider py-4 hover:bg-paper focus-visible:outline-offset-[-2px] sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-2">
                <span className="text-xs font-semibold text-neutral-700 tabular-nums transition-colors group-hover:text-accent-700">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate text-[17px] transition-transform duration-200 group-hover:translate-x-1.5 font-bold tracking-[-.01em] sm:text-lg">{d.title}</span>
                <span className="flex items-center gap-3 text-xs whitespace-nowrap text-neutral-700 tabular-nums">
                  {d.role !== "owner" && (
                    <>
                      <span className="hidden sm:inline">Owner: {d.owner_name}</span>
                      <RolePill role={d.role}>{d.role === "editor" ? "Can edit" : "Can view"}</RolePill>
                    </>
                  )}
                  <span className="hidden sm:inline">{stamp(d.updated_at)}</span>
                  {d.role === "owner" && <span className="sm:hidden">{day(d.updated_at)}</span>}
                  <span aria-hidden="true" className="hidden -translate-x-1 text-accent-700 opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100 sm:inline">
                    →
                  </span>
                </span>
                <LinkLoader label="Opening document" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Login() {
  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-10 px-4 py-16 md:pt-[16vh] sm:px-6 md:grid-cols-[1fr_1fr] md:items-start md:gap-16">
      <div>
        <h1 className={`${display} reveal mb-5`}>
          Ajaia Docs
          <Dot />
        </h1>
        <p className="max-w-sm font-serif text-lg text-neutral-800">Demo: pick a seeded account, or create your own. Use two accounts to try sharing.</p>
      </div>
      <div>
        <div className="mb-3">
          <Kicker>Demo accounts · one click</Kicker>
        </div>
        <div className="border-t-2 border-text">
          {SEED_USERS.map((u, i) => (
            <form key={u.id} action={login} className="rise relative" style={stagger(i)}>
              <input type="hidden" name="userId" value={u.id} />
              <SubmitButton loader={`Opening ${u.name.split(" ")[0]}’s documents`} className="group grid w-full cursor-pointer grid-cols-[2rem_1fr_auto] items-baseline gap-3 border-b border-divider px-1 py-4 text-left hover:bg-paper focus-visible:outline-offset-[-2px] active:shadow-[inset_3px_0_0_var(--color-accent-700)] disabled:cursor-wait disabled:opacity-60">
                <span className="text-xs font-semibold text-neutral-700 tabular-nums group-hover:text-accent-700">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-lg font-bold tracking-[-.01em]">{u.name}</span>
                  <span className="block text-sm text-neutral-700">{u.email}</span>
                </span>
                <span aria-hidden="true" className="text-accent-700 opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </SubmitButton>
            </form>
          ))}
        </div>
        <div className="mt-12">
          <div className="mb-3">
            <Kicker>Or use your own account</Kicker>
          </div>
          <AuthForms />
        </div>
      </div>
    </main>
  );
}
