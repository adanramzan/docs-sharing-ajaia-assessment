"use client";
import { useEffect, useState } from "react";
import type { Presence } from "@/lib/docs";
import { pingPresence } from "../../actions";

// Heartbeat every 10s (and on tab refocus); the response doubles as the "who else is here" list and the current version.
export function usePresence(docId: string): Presence | null {
  const [presence, setPresence] = useState<Presence | null>(null);
  useEffect(() => {
    let live = true;
    const ping = () => {
      if (document.visibilityState === "hidden") return;
      pingPresence(docId).then((p) => live && p && setPresence(p), () => {});
    };
    ping();
    const id = setInterval(ping, 10_000);
    document.addEventListener("visibilitychange", ping);
    return () => {
      live = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [docId]);
  return presence;
}

export function PresenceList({ viewers }: { viewers: Presence["viewers"] }) {
  const initials = (name: string) => name.trim().slice(0, 1).toUpperCase();
  return (
    <div aria-live="polite" className="flex items-center gap-1.5 text-xs text-neutral-700 empty:hidden">
      {viewers.length > 0 && (
        <>
          <span>Also here:</span>
          {viewers.slice(0, 3).map((v) => (
            <span key={v.id} title={v.name} className="inline-flex size-6 items-center justify-center rounded-full bg-accent-100 text-[11px] font-extrabold text-accent-800">
              <span aria-hidden="true">{initials(v.name)}</span>
              <span className="sr-only">{v.name}</span>
            </span>
          ))}
          {viewers.length > 3 && <span className="font-semibold">+{viewers.length - 3}</span>}
        </>
      )}
    </div>
  );
}
