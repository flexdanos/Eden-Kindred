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
/**
 * Whether the development preview identity is active.
 *
 * The gates below consult this because the preview user has no real Supabase
 * session, so the strong-auth check would have nothing to read and would lock
 * the preview out of the very thing it exists to open.
 */
export function isDevPreview(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ADMIN_DEV_BYPASS === "true";
}

function devPreviewUser(): SessionUser | null {
  if (!isDevPreview()) return null;

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
 * How the CURRENT session was authenticated, and at what assurance level.
 *
 * The public site signs people in with an emailed code (see
 * components/auth/auth-modal.tsx); staff sign in with a password at /login.
 * Both hit the same Supabase project, so both produce a session for the same
 * account — which means a staff member's email is, on its own, enough to reach
 * a session that satisfies a role check. The password would be decorative if
 * role were the only gate.
 *
 * So admin surfaces additionally require HOW: a password, or a second factor.
 *
 * On trusting these claims: getUser() sends the access token to Supabase,
 * which verifies its signature. Only once that succeeds do we decode the same
 * token to read its claims — so they are the ones Supabase issued, not
 * anything a client wrote into a cookie. Reading them from getSession() alone,
 * without the getUser() round trip, would be forgeable and is the mistake this
 * ordering exists to avoid.
 */
type AuthAssurance = {
  /** Authentication methods on this session: "password", "otp", "oauth", … */
  methods: string[];
  /** "aal1" = single factor, "aal2" = a second factor was verified. */
  level: string | null;
};

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalised = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalised, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const getAuthAssurance = cache(async (): Promise<AuthAssurance> => {
  // Verification happens inside getSessionUser, which calls getUser() and is
  // memoised for this request. Reusing it keeps the ordering that makes these
  // claims trustworthy while avoiding a second round trip to Supabase Auth on
  // every admin page.
  const user = await getSessionUser();
  if (!user) return { methods: [], level: null };

  const supabase = await createClient();

  // getSession() only reads the cookie — untrustworthy on its own, which is
  // why the getUser() verification above has to come first. By this point the
  // token in that cookie is known to be one Supabase issued.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { methods: [], level: null };

  const claims = decodeJwtClaims(session.access_token);
  if (!claims) return { methods: [], level: null };

  const amr = Array.isArray(claims.amr) ? claims.amr : [];
  const methods = amr
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : typeof entry === "object" && entry !== null && "method" in entry
          ? String((entry as { method: unknown }).method)
          : null,
    )
    .filter((m): m is string => Boolean(m));

  return { methods, level: typeof claims.aal === "string" ? claims.aal : null };
});

/**
 * Is this session strong enough for the admin console?
 *
 * True for a password sign-in, or for any session that cleared a second factor.
 * An emailed-code session is deliberately NOT strong: that is the whole point —
 * inbox access alone must not reach the admin.
 */
export async function hasStrongAuth(): Promise<boolean> {
  const { methods, level } = await getAuthAssurance();
  if (level === "aal2") return true;
  return methods.some((m) => m === "password" || m === "mfa" || m === "totp");
}

/**
 * Gate for the musicians' area.
 *
 * Staff get in automatically — someone who can edit the whole site being
 * locked out of the rehearsal notes would be theatre, not security.
 *
 * Deliberately does NOT require strong auth. Musicians are a public-side
 * audience who sign in with an emailed code, and chord charts are not worth
 * making them keep a password for.
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

  // Role says WHO. This says HOW: an emailed-code session belongs to the
  // right person but is not a strong enough proof to run the admin on.
  if (!isDevPreview() && !(await hasStrongAuth())) {
    redirect("/login?reason=step-up&next=/admin");
  }

  return user;
}

/** Stricter variant for destructive and settings-level operations. */
export async function assertAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/admin?denied=1");

  if (!isDevPreview() && !(await hasStrongAuth())) {
    redirect("/login?reason=step-up&next=/admin");
  }

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

  // Server Actions are reachable without ever rendering an admin page, so the
  // step-up requirement has to be repeated here rather than trusted from the
  // route guard.
  if (!isDevPreview() && !(await hasStrongAuth())) {
    return {
      ok: false,
      error: "Sign in with your password to make changes. An emailed code isn't enough here.",
    };
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

  if (!isDevPreview() && !(await hasStrongAuth())) {
    return {
      ok: false,
      error: "Sign in with your password to make changes. An emailed code isn't enough here.",
    };
  }

  return { ok: true, user };
}
