import "server-only";

/**
 * Runs a query and falls back rather than throwing.
 *
 * Purpose is narrow and deliberate: before Supabase is wired up (no
 * .env.local, empty database), `npm run dev` should still render the whole
 * designed site rather than a stack trace. It also means one unreachable
 * section can't take the whole page down in production.
 *
 * It is NOT a general error-swallower — the failure is logged every time, and
 * mutations must never use it.
 */
export async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[db] ${label} unavailable — rendering fallback. ${message}`);
    return fallback;
  }
}
