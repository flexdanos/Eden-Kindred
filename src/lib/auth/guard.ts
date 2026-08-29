import "server-only";

import { cache } from "react";
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
  isTeamMember: boolean;
  instrument: string | null;
};

/**
 * DEVELOPMENT-ONLY preview identity.
 *
 * The admin is gated on a Supabase session, and the first admin is made by
 * promoting a real profile row — which is impossible before a database exists.
 * That leaves the admin UI unviewable during early local work, so this opens it
 * when BOTH conditions hold:
 *
 *   1. NODE_ENV is not "production" — a production build can never satisfy this,
 *      whatever the environment variables say.
 *   2. ADMIN_DEV_BYPASS is exactly "true" — opt-in, never a default.
 *
 * Two independent guards on purpose: one of them being wrong should not be
 * enough. Vercel sets NODE_ENV=production on every deployment, so even shipping
 * the variable by mistake cannot unlock a live site.
 *
 * READ-ONLY IN PRACTICE. The returned id belongs to no profiles row, so any
 * write referencing it (a post's author, a block's editor) fails the foreign
 * key. That is the intended limit: this is for looking at the interface, not
 * operating it. Delete the variable once you can sign in for real.
 */
function devPreviewUser(): SessionUser | null {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.ADMIN_DEV_BYPASS !== "true") return null;

  console.warn(
    "[auth] ADMIN_DEV_BYPASS is on — admin routes are UNAUTHENTICATED. Development only.",
  );

  return {
    id: "00000000-0000-0000-0000-000000000000",
    email: "preview@localhost",
    fullName: "Preview (no auth)",
    avatarUrl: null,
    role: "admin",
    isTeamMember: true,
    instrument: null,
  };
}

/**
 * The signed-in user with their profile row, or null.
 *
 * Memoised per request with React's `cache`. Without it, every call did a
 * network round trip to Supabase Auth PLUS a profile query — and an admin page
 * render makes several: the layout calls assertStaff(), then the page calls it
 * again, and anything else needing the user calls it too. On a database in
 * eu-west-1 that was hundreds of milliseconds of duplicated waiting on every
 * navigation.
 *
 * `cache` is per-request, not a shared cache: two visitors never see each
 * other's session, and a fresh request always revalidates the JWT. It only
 * collapses repeat calls within one render pass, which is exactly the waste.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const preview = devPreviewUser();
  if (preview) return preview;

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
      isTeamMember: profiles.isTeamMember,
      instrument: profiles.instrument,
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
    isTeamMember: profile?.isTeamMember ?? false,
    instrument: profile?.instrument ?? null,
  };
});

/**
 * Gate for the musicians' area.
 *
 * Staff get in automatically — someone who can edit the whole site being
 * locked out of the rehearsal notes would be theatre, not security.
 */
export async function assertTeamMember(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/team");

  const allowed = user.isTeamMember || user.role === "admin" || user.role === "editor";
  if (!allowed) redirect("/?denied=team");

  return user;
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
