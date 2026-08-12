"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import type { ActionState } from "@/app/admin/mutations";

const initial: ActionState = { ok: false };

/**
 * Shared save shell for every admin editor.
 *
 * One component so the "save" affordance is identical on every screen — an
 * inconsistent save button across an admin is the product-register tell. It
 * owns pending, success, and error states so no individual form can ship with
 * half of them.
 */
export function SaveForm({
  action,
  children,
  submitLabel = "Save",
  children_footer,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: (state: ActionState) => React.ReactNode;
  submitLabel?: string;
  children_footer?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="max-w-2xl">
      {state.message && (
        <div
          role={state.ok ? "status" : "alert"}
          className={`mb-5 flex items-start gap-2 border px-4 py-3 text-sm ${
            state.ok
              ? "border-[color-mix(in_oklch,var(--brand-success)_35%,transparent)] bg-[color-mix(in_oklch,var(--brand-success)_8%,var(--background))]"
              : "border-[color-mix(in_oklch,var(--brand)_35%,transparent)] bg-[color-mix(in_oklch,var(--brand)_6%,var(--background))]"
          }`}
        >
          {state.ok ? (
            <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0" />
          ) : (
            <TriangleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
          )}
          {state.message}
        </div>
      )}

      {children(state)}

      <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
        <SubmitButton label={submitLabel} />
        {children_footer}
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-[var(--brand-hover)] disabled:opacity-60 disabled:cursor-progress"
    >
      {pending && <Loader2 size={14} className="animate-spin" aria-hidden />}
      {pending ? "Saving…" : label}
    </button>
  );
}

/** Consistent labelled field. Same vocabulary on every admin screen. */
export function Field({
  label,
  name,
  hint,
  errors,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  const errId = `${name}-error`;
  return (
    <div className="mb-5">
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !errors?.length && (
        <p className="m-0 mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
      {errors?.length ? (
        <p id={errId} role="alert" className="m-0 mt-1.5 text-xs text-primary">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors duration-150 focus:border-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
