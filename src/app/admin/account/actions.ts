"use server";

import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";
import type { ActionState } from "@/app/admin/mutations";

const MIN_PASSWORD = 8;

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters.`),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    path: ["confirm"],
    message: "The two new passwords don't match.",
  })
  .refine((d) => d.next !== d.current, {
    path: ["next"],
    message: "Choose a password different from your current one.",
  });

/**
 * Change the signed-in staff member's own password.
 *
 * The current password is checked first. A session alone is not enough proof:
 * an admin who walked away from an unlocked laptop should not be able to have
 * their password changed out from under them.
 *
 * That check uses a separate, cookie-less client so it cannot replace the
 * session in this browser; its throwaway session is signed out straight after
 * (scope "local" — only that one session, not every device).
 */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, message: auth.error };

  const parsed = schema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = auth.user.email;
  if (!email) {
    return { ok: false, message: "This session has no email address, so there's no password to change." };
  }

  const { url, key } = requireSupabasePublicEnv();
  const verifier = createStatelessClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email,
    password: parsed.data.current,
  });
  if (verifyError) {
    return {
      ok: false,
      message: "Your current password is incorrect.",
      fieldErrors: { current: ["Incorrect password."] },
    };
  }
  await verifier.auth.signOut({ scope: "local" });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Password changed. Use the new one next time you sign in." };
}
