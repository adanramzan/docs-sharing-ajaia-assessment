"use client";
import { useLinkStatus } from "next/link";
import { Loader } from "./ui";

// Place inside a <Link>: covers the clicked row with the loader while that navigation is pending, same as `SubmitButton loader`.
export function LinkLoader({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return pending ? <Loader label={label} /> : null;
}
