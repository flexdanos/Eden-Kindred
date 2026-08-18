import postgres from "postgres";
import { config } from "dotenv";

/**
 * Proves the RLS policies actually hold, rather than trusting that the SQL ran
 * without error. Those are very different claims.
 *
 *   node scripts/verify-rls.mjs
 *
 * Each check runs inside a transaction that is rolled back, with the session
 * role switched to `anon` — the same role the public anon key resolves to. It
 * is read-only and safe to run against any environment.
 */

config({ path: ".env.local" });

const sql = postgres(process.env.DIRECT_URL, {
  max: 1,
  prepare: false,
  idle_timeout: 10,
  onnotice: () => {},
});

let failures = 0;
const pass = (m) => console.log(`  PASS  ${m}`);
const fail = (m) => {
  console.log(`  FAIL  ${m}`);
  failures++;
};

/** Runs `fn` as the anon role, then rolls back. */
async function asAnon(fn) {
  return sql.begin(async (tx) => {
    await tx.unsafe("set local role anon");
    try {
      return await fn(tx);
    } finally {
      await tx.unsafe("reset role");
    }
  });
}

console.log("\n1. RLS enabled on every public table");
const tables = await sql`
  select c.relname as table, c.relrowsecurity as rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by c.relname
`;
for (const t of tables) {
  if (t.rls) pass(t.table);
  else fail(`${t.table} — RLS is OFF`);
}

console.log("\n2. Policy counts");
const counts = await sql`
  select tablename, count(*)::int as n
  from pg_policies where schemaname = 'public'
  group by tablename order by tablename
`;
for (const c of counts) console.log(`  ${String(c.n).padStart(2)}  ${c.tablename}`);
const covered = new Set(counts.map((c) => c.tablename));
for (const t of tables) {
  if (!covered.has(t.table)) console.log(`   0  ${t.table}  (locked — no policy)`);
}

console.log("\n3. What the anon role can actually reach");

// team_resources: rehearsal material. Must be invisible.
await asAnon(async (tx) => {
  try {
    const [r] = await tx.unsafe("select count(*)::int as n from public.team_resources");
    if (r.n === 0) pass("team_resources returns 0 rows to anon");
    else fail(`team_resources leaked ${r.n} rows to anon`);
  } catch (e) {
    pass(`team_resources refused outright (${e.message.split("\n")[0]})`);
  }
});

// donations: no public select policy at all.
await asAnon(async (tx) => {
  try {
    const [r] = await tx.unsafe("select count(*)::int as n from public.donations");
    if (r.n === 0) pass("donations returns 0 rows to anon");
    else fail(`donations leaked ${r.n} rows to anon`);
  } catch (e) {
    pass(`donations refused outright (${e.message.split("\n")[0]})`);
  }
});

// public_partners: the column-filtered view. Must be reachable AND must expose
// only two columns — the whole reason it exists.
const viewCols = await sql`
  select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'public_partners'
  order by ordinal_position
`;
const names = viewCols.map((c) => c.column_name);
const leaky = names.filter(
  (n) => !["partner_name", "paid_at"].includes(n),
);
if (names.length === 0) fail("public_partners view is missing");
else if (leaky.length === 0) pass(`public_partners exposes only ${names.join(", ")}`);
else fail(`public_partners exposes extra columns: ${leaky.join(", ")}`);

await asAnon(async (tx) => {
  try {
    await tx.unsafe("select count(*) from public.public_partners");
    pass("public_partners is readable by anon");
  } catch (e) {
    fail(`public_partners unreachable by anon: ${e.message.split("\n")[0]}`);
  }
});

console.log("\n4. Privilege columns are pinned against self-escalation");
const [profileUpdate] = await sql`
  select with_check from pg_policies
  where schemaname = 'public' and tablename = 'profiles'
    and policyname = 'profiles: update own'
`;
if (!profileUpdate) {
  fail("'profiles: update own' policy is missing");
} else {
  const check = profileUpdate.with_check ?? "";
  if (check.includes("role") && check.includes("is_team_member")) {
    pass("both role and is_team_member are pinned in WITH CHECK");
  } else {
    fail(`WITH CHECK does not pin both columns: ${check}`);
  }
}

console.log("\n5. Storage bucket");
const buckets = await sql`select id, public, file_size_limit from storage.buckets where id = 'media'`;
if (buckets.length === 0) fail("media bucket missing");
else pass(`media bucket exists (public=${buckets[0].public}, limit=${buckets[0].file_size_limit})`);

const storagePolicies = await sql`
  select policyname from pg_policies
  where schemaname = 'storage' and tablename = 'objects' and policyname like 'media:%'
`;
if (storagePolicies.length >= 4) pass(`${storagePolicies.length} storage policies on the media bucket`);
else fail(`only ${storagePolicies.length} storage policies found, expected 4`);

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} CHECK(S) FAILED.\n`);
await sql.end();
process.exitCode = failures === 0 ? 0 : 1;
