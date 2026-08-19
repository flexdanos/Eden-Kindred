import { readFileSync } from "node:fs";
import postgres from "postgres";
import { config } from "dotenv";

/**
 * Applies a .sql file over the DIRECT connection.
 *
 *   node scripts/apply-sql.mjs supabase/rls-policies.sql
 *
 * Two details that matter:
 *
 *  - DIRECT_URL (port 5432), not the pooler. DDL and `create policy` need
 *    session state that transaction pooling does not keep.
 *  - `.simple()` uses the simple query protocol, which is what allows many
 *    statements in one round trip. The extended protocol permits exactly one,
 *    and splitting the file on ';' would tear apart the $$-quoted function
 *    bodies in rls-policies.sql.
 *
 * The files are written to be re-runnable (`drop policy if exists` before each
 * `create policy`), so running this twice is safe.
 */

config({ path: ".env" });

const url = process.env.DIRECT_URL;
if (!url) {
  console.error("DIRECT_URL is not set in .env");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/apply-sql.mjs <file.sql>");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, idle_timeout: 10 });

try {
  await sql.unsafe(readFileSync(file, "utf8")).simple();
  console.log(`OK   ${file}`);
} catch (error) {
  console.error(`FAIL ${file}`);
  console.error(`  ${error.message}`);
  if (error.position) console.error(`  at character ${error.position}`);
  if (error.detail) console.error(`  detail: ${error.detail}`);
  if (error.hint) console.error(`  hint: ${error.hint}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
