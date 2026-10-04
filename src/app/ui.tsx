import type { ReactNode } from "react";

// Shared Modernist class strings: square corners, divider borders, 800-weight labels.
const btn = "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-extrabold leading-tight enabled:active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-45";
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
