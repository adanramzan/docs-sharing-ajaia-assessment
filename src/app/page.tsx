import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { SEED_USERS } from "@/lib/db";
import { listDocs, type DocSummary } from "@/lib/docs";
import { createDocument, login, logout } from "./actions";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  if (!user) return <Login />;
  const { owned, shared } = await listDocs(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Ajaia Docs</h1>
        <form action={logout} className="flex items-center gap-3 text-sm text-gray-600">
          <span>
            {user.name} <span className="text-gray-400">({user.email})</span>
          </span>
          <button className="rounded border px-2 py-1 hover:bg-gray-50">Switch user</button>
        </form>
      </header>

      <section className="mb-10 flex flex-wrap items-start gap-4">
        <form action={createDocument}>
          <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">+ New document</button>
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
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {docs.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="divide-y rounded border">
          {docs.map((d) => (
            <li key={d.id}>
              <Link href={`/docs/${d.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50">
                <span className="truncate font-medium">{d.title}</span>
                <span className="shrink-0 text-xs text-gray-500">
                  {d.role !== "owner" && (
                    <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5">
                      {d.owner_name} · {d.role}
                    </span>
                  )}
                  {new Date(d.updated_at).toLocaleString()}
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
      <h1 className="mb-2 text-2xl font-semibold">Ajaia Docs</h1>
      <p className="mb-6 text-sm text-gray-600">Demo login: pick a seeded account. Use two accounts to try sharing.</p>
      <div className="space-y-2">
        {SEED_USERS.map((u) => (
          <form key={u.id} action={login}>
            <input type="hidden" name="userId" value={u.id} />
            <button className="w-full rounded border px-4 py-3 text-left hover:bg-gray-50">
              <span className="font-medium">{u.name}</span>
              <span className="block text-xs text-gray-500">{u.email}</span>
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
