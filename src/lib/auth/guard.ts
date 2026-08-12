import "server-only";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "editor" | "member";

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
};

/** The signed-in user with their profile row, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();

  // getUser() revalidates the JWT against Supabase. getSession() only reads the
  // cookie, which a client can forge — never authorise on getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profile] = await db
    .select({
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      role: profiles.role,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.fullName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    role: (profile?.role as Role) ?? "member",
  };
}

/**
 * The authorisation check for every admin surface.
 *
 * Drizzle connects as a privileged Postgres role, so RLS does not evaluate on
 * any query it makes. This function — not a policy — is what stops a member
 * from editing content. Call it at the top of every admin Server Action and
 * every admin route segment. There are no exceptions.
 */
export async function assertStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin" && user.role !== "editor") redirect("/?denied=1");
  return user;
}

/** Stricter variant for destructive and settings-level operations. */
export async function assertAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/admin?denied=1");
  return user;
}

/**
 * Non-redirecting variant for Server Actions, which should return an error to
 * the form rather than throw a redirect mid-mutation.
 */
export async function requireStaff(): Promise<
  { ok: true; user: SessionUser } | { ok: false; error: string }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "You are signed out. Sign in and try again." };
  if (user.role !== "admin" && user.role !== "editor") {
    return { ok: false, error: "You do not have permission to do that." };
  }
  return { ok: true, user };
}

/** Admin-only variant of requireStaff, for destructive and settings-level writes. */
export async function requireAdmin(): Promise<
  { ok: true; user: SessionUser } | { ok: false; error: string }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "You are signed out. Sign in and try again." };
  if (user.role !== "admin") {
    return { ok: false, error: "Only an admin can do that." };
  }
  return { ok: true, user };
}
