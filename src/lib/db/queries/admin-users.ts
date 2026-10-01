import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Role } from "@/lib/auth/guard";

export type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: Role;
  isTeamMember: boolean;
  createdAt: Date;
  lastSignInAt: Date | null;
  emailConfirmedAt: Date | null;
};

/**
 * Every account that has signed up, newest first.
 *
 * Read from auth.users rather than profiles alone: email, sign-up time and
 * last sign-in live there, and an account whose profile row is missing (made
 * before the trigger existed) should still show up. Drizzle's connection is
 * privileged, so the auth schema is readable — which is also why the page
 * calling this must be behind assertAdmin().
 */
export async function listUsers(): Promise<AdminUserRow[]> {
  const rows = await db.execute<{
    id: string;
    email: string | null;
    full_name: string | null;
    role: Role | null;
    is_team_member: boolean | null;
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
  }>(sql`
    select
      u.id,
      u.email,
      coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name') as full_name,
      p.role::text as role,
      p.is_team_member,
      u.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.deleted_at is null
    order by u.created_at desc
  `);

  const date = (v: string | null) => (v ? new Date(v) : null);

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role ?? "member",
    isTeamMember: r.is_team_member ?? false,
    createdAt: new Date(r.created_at),
    lastSignInAt: date(r.last_sign_in_at),
    emailConfirmedAt: date(r.email_confirmed_at),
  }));
}

/** One account's email, for the guards in setUserRole. */
export async function getUserEmail(id: string): Promise<string | null | undefined> {
  const rows = await db.execute<{ email: string | null }>(
    sql`select email from auth.users where id = ${id} limit 1`,
  );
  return rows.length ? rows[0].email : undefined;
}
