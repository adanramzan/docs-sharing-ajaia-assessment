"use client";
import { useActionState, useState, type CSSProperties } from "react";
import { signin, signup } from "./actions";
import { btnPrimary, input } from "./ui";

const label = "text-xs font-semibold text-neutral-800";
// Equal-width tabs so one indicator can slide between them with a plain translate.
const tab = "w-36 cursor-pointer pt-3 pb-1 text-left text-sm font-extrabold";

export function AuthForms() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const isSignup = mode === "signup";
  // Kept here so name/email survive mode switches and React 19's post-action form reset; password is intentionally cleared.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex border-t-2 border-text" role="group" aria-label="Account mode">
        <span aria-hidden="true" className={`absolute -top-0.5 left-0 h-0.5 bg-accent transition-[translate,width] duration-300 ease-[cubic-bezier(.25,1,.5,1)] ${isSignup ? "w-[6.75rem] translate-x-36" : "w-12"}`} />
        <button type="button" aria-pressed={!isSignup} onClick={() => setMode("signin")} className={`${tab} ${isSignup ? "text-neutral-700 hover:text-text" : ""}`}>
          Sign in
        </button>
        <button type="button" aria-pressed={isSignup} onClick={() => setMode("signup")} className={`${tab} ${isSignup ? "" : "text-neutral-700 hover:text-text"}`}>
          Create account
        </button>
      </div>
      <AuthForm key={mode} isSignup={isSignup} name={name} setName={setName} email={email} setEmail={setEmail} />
    </div>
  );
}

// Keyed by mode so each mode gets its own action state (a sign-in error doesn't leak into sign-up).
function AuthForm({ isSignup, name, setName, email, setEmail }: { isSignup: boolean; name: string; setName: (v: string) => void; email: string; setEmail: (v: string) => void }) {
  const [state, action, pending] = useActionState(isSignup ? signup : signin, null);
  const err = !pending && state && !state.ok ? state.error : null;
  return (
      <form action={action} className="cascade flex flex-col gap-2" style={{ "--dir": isSignup ? 1 : -1 } as CSSProperties}>
        {isSignup && (
          <>
            <label className={label} htmlFor="auth-name">Name</label>
            <input id="auth-name" name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </>
        )}
        <label className={label} htmlFor="auth-email">Email</label>
        <input id="auth-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={err ? true : undefined} className={input} />
        <label className={label} htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          name="password"
          type="password"
          required
          minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? "new-password" : "current-password"}
          aria-invalid={err ? true : undefined}
          className={input}
        />
        {isSignup && <p className="text-xs text-neutral-700">At least 8 characters.</p>}
        {err && <p role="alert" className="text-[13px] font-semibold text-danger">{err}</p>}
        <div className="pt-2">
          <button disabled={pending} className={btnPrimary}>
            {isSignup ? (pending ? "Creating account…" : "Create account") : pending ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
  );
}
