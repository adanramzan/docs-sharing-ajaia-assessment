import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// Shared Editorial Modernist class strings: square corners, ink rules, 800-weight labels.
const btn = "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-extrabold leading-tight enabled:active:scale-[.94] disabled:cursor-not-allowed disabled:opacity-45";
export const btnPrimary = `${btn} bg-accent-700 px-4 py-2.5 text-sm text-white hover:bg-accent-800 active:bg-accent-800 active:shadow-[inset_0_2px_0_rgba(0,0,0,.25)]`;
export const btnSecondary = `${btn} border border-control px-3 py-1.5 text-[13px] hover:bg-text/7 active:bg-text/14 disabled:hover:bg-transparent`;
export const linkDanger = "cursor-pointer whitespace-nowrap text-xs font-semibold text-danger hover:text-danger-800 hover:underline disabled:opacity-45";
export const input = "min-h-9 w-full border border-control bg-bg px-2.5 py-1.5 text-sm caret-accent placeholder:text-neutral-700 hover:border-text focus-visible:border-accent focus-visible:outline-offset-0 aria-invalid:border-danger";

const pill = {
  owner: "bg-neutral-900 text-bg",
  editor: "bg-accent-100 text-accent-800",
  viewer: "bg-neutral-200 text-neutral-800",
};

export function RolePill({ role, children }: { role: keyof typeof pill; children?: ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 text-[11px] tracking-[.02em] whitespace-nowrap ${pill[role]}`}>{children ?? role}</span>;
}

// Oversized editorial headline; `dot` ends it with a vermilion full stop.
export const display = "text-[clamp(2rem,4.5vw,2.75rem)] leading-none font-extrabold tracking-[-.035em] text-balance";
export const Dot = () => <span className="pop text-accent">.</span>;
// Feeds the `.rise` cascade: each item enters 70ms after the previous one.
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

// Covers the clicked row (its nearest `relative` ancestor) while the page it leads to loads.
// `compact` fits it inside a single button: shorter rule, smaller mark, label for screen readers only.
export function Loader({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <span role="status" className="swipe absolute inset-0 z-10 flex items-center justify-center gap-4 overflow-hidden bg-paper">
      <span className={`relative border-b-2 border-text ${compact ? "h-2 w-8 [--track:2rem]" : "h-3 w-24"}`}>
        <span className={`march absolute bottom-1 left-0 bg-accent ${compact ? "size-2" : "size-3"}`} />
      </span>
      <span className={`text-[11px] leading-none font-extrabold tracking-[.14em] uppercase ${compact ? "sr-only" : ""}`}>{label}…</span>
    </span>
  );
}

// Section label: small caps-style kicker with an optional count.
export function Kicker({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="flex items-baseline gap-2 text-[11px] leading-none font-extrabold tracking-[.14em] uppercase">
      {children}
      {count !== undefined && <span className="font-semibold text-neutral-700 tabular-nums">{String(count).padStart(2, "0")}</span>}
    </h2>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-[13px] leading-none font-extrabold tracking-[.16em] whitespace-nowrap uppercase">
      <span aria-hidden="true" className="size-2.5 bg-accent" />
      Ajaia Docs
    </Link>
  );
}

// Top bar shared by every signed-in page: wordmark left, context right, heavy ink rule below.
export function Masthead({ children }: { children: ReactNode }) {
  return (
    <header className="draw flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-3 text-sm">
      <Wordmark />
      {children}
    </header>
  );
}
