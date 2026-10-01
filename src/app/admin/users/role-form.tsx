"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/app/admin/mutations";
import type { Role } from "@/lib/auth/guard";
import { setUserRole } from "./actions";

const initial: ActionState = { ok: false };

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  member: "Member",
};

/** Inline role picker for one row of the users table. */
export function RoleForm({
  userId,
  role,
  locked,
  lockedReason,
}: {
  userId: string;
  role: Role;
  /** Your own row, or the super admin's: shown, not editable. */
  locked?: boolean;
  lockedReason?: string;
}) {
  const [state, formAction] = useActionState(setUserRole, initial);

  if (locked) {
    return (
      <span className="text-sm">
        {ROLE_LABEL[role]}
        {lockedReason && (
          <span className="block text-xs text-muted-foreground">{lockedReason}</span>
        )}
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={userId} />
      <div className="flex items-center gap-2">
        <select
          name="role"
          defaultValue={role}
          aria-label="Role"
          className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:border-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <SaveButton />
      </div>
      {state.message && (
        <span
          role={state.ok ? "status" : "alert"}
          className={`text-xs ${state.ok ? "text-muted-foreground" : "text-primary"}`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-accent disabled:opacity-60"
    >
      {pending && <Loader2 size={12} className="animate-spin" aria-hidden />}
      Save
    </button>
  );
}
