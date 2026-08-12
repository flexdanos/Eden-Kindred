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
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase connection strings.",
    );
  }

  /**
   * Runtime goes through Supabase's TRANSACTION-mode pooler (port 6543).
   * Two settings are load-bearing on serverless:
   *
   *  - `prepare: false` — transaction pooling hands out a different backend per
   *    statement, so a named prepared statement from the previous request is
   *    not there. Leaving this on gives intermittent "prepared statement does
   *    not exist" errors that only appear under concurrency.
   *  - `max: 1` — one connection per serverless instance. Anything larger
   *    multiplies by instance count and exhausts the pooler.
   *
   * Migrations use DIRECT_URL (port 5432) instead — see drizzle.config.ts.
   */
  const client =
    globalThis.__edenKindredSql ??
    postgres(connectionString, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

  if (process.env.NODE_ENV !== "production") {
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
