import "server-only";

/**
 * Runs a query and falls back rather than throwing.
 *
 * Purpose is narrow and deliberate: before Supabase is wired up (no
 * .env, empty database), `npm run dev` should still render the whole
 * designed site rather than a stack trace. It also means one unreachable
 * section can't take the whole page down in production.
 *
 * It is NOT a general error-swallower — the failure is logged every time, and
 * mutations must never use it.
 */
export async function safe<T>(
  label: string,
  run: () => Promise<T>,
  fallback: T,
  /**
   * A wedged pooled connection never errors — it just never answers, and
   * without a limit the page waits on it for minutes. Past this, render the
   * fallback. (The query itself isn't cancelled; postgres.js has no per-query
   * timeout. This only stops it holding the page hostage.)
   */
  timeoutMs = 10_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[db] ${label} unavailable — rendering fallback. ${message}`);
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
