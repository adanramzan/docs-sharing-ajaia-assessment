"use client";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Loader } from "./ui";

// Disables itself while its form's server action runs, so slow DB round trips can't cause double submits.
// `loader` covers the nearest `relative` ancestor with the loader while the action runs (for actions that redirect).
export function SubmitButton({ pendingText, loader, children, ...props }: ComponentProps<"button"> & { pendingText?: string; loader?: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button {...props} disabled={pending || props.disabled} aria-busy={pending}>
        {pending && pendingText ? pendingText : children}
      </button>
      {pending && loader && <Loader label={loader} />}
    </>
  );
}
