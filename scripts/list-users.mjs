import postgres from "postgres";
import { config } from "dotenv";

/**
 * Shows every auth user alongside its profiles row.
 *
 *   node scripts/list-users.mjs
 *
 * The usual reason /admin bounces to /?denied=1 is that the profile says
 * "member" — either the promote SQL was never run, or the handle_new_user
 * trigger was not installed when the account was created, so there is no
 * profiles row at all and the guard falls back to the default role.
 *
 * Read-only.
 */

config({ path: ".env" });

const sql = postgres(process.env.DIRECT_URL, {
  max: 1,
  prepare: false,
  idle_timeout: 10,
  onnotice: () => {},
});

const rows = await sql`
  select
    u.email,
    u.created_at,
    u.last_sign_in_at,
    (u.encrypted_password is not null and u.encrypted_password <> '') as has_password,
    p.id is not null as has_profile,
    p.role::text as role,
    p.is_team_member
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at
`;

if (rows.length === 0) {
  console.log("\nNo auth users exist yet.\n");
} else {
  console.log("");
  for (const r of rows) {
    console.log(`  ${r.email}`);
    console.log(`    profile row : ${r.has_profile ? "yes" : "NO — trigger missing when created"}`);
    console.log(`    role        : ${r.role ?? "(none)"}`);
    console.log(`    password set: ${r.has_password ? "yes" : "NO — step-up to /admin will refuse"}`);
    console.log(`    team member : ${r.is_team_member ?? "(n/a)"}`);
    console.log("");
  }

  const staff = rows.filter((r) => r.role === "admin" || r.role === "editor");
  if (staff.length === 0) {
    console.log("  No admin or editor exists. /admin will redirect to /?denied=1 for everyone.");
  } else {
    const noPassword = staff.filter((r) => !r.has_password);
    if (noPassword.length > 0) {
      console.log(
        `  ${noPassword.length} staff account(s) have no password, so the admin step-up check will refuse them:`,
      );
      for (const r of noPassword) console.log(`    - ${r.email}`);
    }
  }
  console.log("");
}

await sql.end();
