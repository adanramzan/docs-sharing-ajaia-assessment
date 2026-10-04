"use client";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

// Disables itself while its form's server action runs, so slow DB round trips can't cause double submits.
export function SubmitButton({ pendingText, children, ...props }: ComponentProps<"button"> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button {...props} disabled={pending || props.disabled} aria-busy={pending}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
