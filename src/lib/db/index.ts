import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __edenKindredSql: ReturnType<typeof postgres> | undefined;
}

let instance: PostgresJsDatabase<typeof schema> | null = null;

function connect(): PostgresJsDatabase<typeof schema> {
  if (instance) return instance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill in your Supabase connection strings.",
    );
  }

  const isProduction = process.env.NODE_ENV === "production";

  /**
   * Runtime goes through Supabase's TRANSACTION-mode pooler (port 6543).
   * Load-bearing settings:
   *
   *  - `prepare: false` — transaction pooling hands out a different backend per
   *    statement, so a named prepared statement from the previous request is
   *    not there. Leaving this on gives intermittent "prepared statement does
   *    not exist" errors that only appear under concurrency.
   *  - `max: 1` in production — one connection per serverless instance.
   *    Anything larger multiplies by instance count and exhausts the pooler.
   *    In dev there is only ever one instance (this process), and a single
   *    connection means one wedged query blocks every request until the
   *    process restarts — a few connections here costs nothing and survives
   *    that.
   *  - `max_lifetime` — a request whose client disconnects mid-query (a
   *    cancelled fetch, a dev Fast Refresh) can leave the pooler-side backend
   *    waiting forever on a socket nothing will ever write to again. Forcibly
   *    recycling the connection bounds how long that wedge can last instead
   *    of requiring a manual pg_terminate_backend.
   *
   * Migrations use DIRECT_URL (port 5432) instead — see drizzle.config.ts.
   */
  const client =
    globalThis.__edenKindredSql ??
    postgres(connectionString, {
      prepare: false,
      max: isProduction ? 1 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
      max_lifetime: 120,
    });

  if (!isProduction) {
    globalThis.__edenKindredSql = client;
  }

  instance = drizzle(client, { schema });
  return instance;
}

/**
 * Connects on first use rather than at import.
 *
 * This matters: `safe()` in ./safe.ts catches query failures so the site still
 * renders before Supabase is wired up. If the client were constructed at module
 * scope, a missing DATABASE_URL would throw during import — before any
 * try/catch could see it — and take the whole page down instead.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(connect(), prop, receiver);
  },
});

export { schema };
