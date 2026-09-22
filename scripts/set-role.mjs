import postgres from "postgres";
import { config } from "dotenv";

/**
 * Grants a role to an existing account.
 *
 *   node scripts/set-role.mjs someone@example.com admin
 *   node scripts/set-role.mjs someone@example.com editor
 *   node scripts/set-role.mjs someone@example.com member
 *
 * The first admin has to be made this way. Signing up only ever produces a
 * `member` — deliberately, since the alternative is a sign-up flow that can
 * hand out admin, and RLS blocks self-promotion (see the WITH CHECK on
 * "profiles: update own" in supabase/rls-policies.sql). This script connects
 * as the database owner, which is the one path that bypasses that policy.
 *
 * Run scripts/list-users.mjs afterwards to confirm.
 */

config({ path: ".env" });

const [email, role] = process.argv.slice(2);
const VALID = ["admin", "editor", "member"];

if (!email || !role) {
  console.error("usage: node scripts/set-role.mjs <email> <admin|editor|member>");
  process.exit(1);
}
if (!VALID.includes(role)) {
  console.error(`role must be one of: ${VALID.join(", ")}`);
  process.exit(1);
}

const sql = postgres(process.env.DIRECT_URL, {
  max: 1,
  prepare: false,
  idle_timeout: 10,
  onnotice: () => {},
});

try {
  const [user] = await sql`select id from auth.users where email = ${email}`;
  if (!user) {
    console.error(`No auth user with email ${email}. Create the account first.`);
    process.exitCode = 1;
  } else {
    // The profiles row normally arrives via the handle_new_user trigger. Insert
    // it if it is missing, so an account created before the trigger existed can
    // still be promoted rather than silently updating zero rows.
    const [updated] = await sql`
      insert into public.profiles (id, role)
      values (${user.id}, ${role}::role)
      on conflict (id) do update set role = ${role}::role
      returning id, role::text as role
    `;
    console.log(`${email} is now ${updated.role}`);
  }
} catch (error) {
  console.error(`Failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
