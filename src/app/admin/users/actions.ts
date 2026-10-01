"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { isSuperAdminEmail } from "@/lib/auth/super-admin";
import { getUserEmail } from "@/lib/db/queries/admin-users";
import type { ActionState } from "@/app/admin/mutations";

const roleSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["admin", "editor", "member"]),
});

/**
 * Grant or remove staff access. Admin-only — requireAdmin() is the only check
 * that runs, as everywhere in the admin (Drizzle bypasses RLS).
 *
 * Two refusals on top of that:
 *  - your own role: an admin demoting themselves is how a site ends up with
 *    no admin at all, and there is no UI path back from that.
 *  - the super admin: the one account that must always be able to get in.
 */
export async function setUserRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, message: auth.error };

  const parsed = roleSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, message: "That role change didn't make sense." };

  const { id, role } = parsed.data;

  if (id === auth.user.id) {
    return { ok: false, message: "You can't change your own role. Ask another admin." };
  }

  const email = await getUserEmail(id);
  if (email === undefined) return { ok: false, message: "That account no longer exists." };

  if (isSuperAdminEmail(email) && role !== "admin") {
    return { ok: false, message: "The super admin always stays an admin." };
  }

  // Upsert, not update: an account created before the profiles trigger existed
  // has no row, and an update would silently change nothing.
  await db.execute(sql`
    insert into public.profiles (id, role)
    values (${id}, ${role}::role)
    on conflict (id) do update set role = excluded.role
  `);

  revalidatePath("/admin/users");
  return { ok: true, message: `${email ?? "Account"} is now ${role === "member" ? "a member" : `an ${role}`}.` };
}
