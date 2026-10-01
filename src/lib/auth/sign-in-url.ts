/**
 * Where to send someone who has to sign in: the home page, with the auth modal
 * told to open itself (see AuthQueryOpener in auth-modal-context.tsx).
 *
 * Shared by the server guards, the middleware and the /login redirect, so the
 * query shape lives in one place.
 */
export function signInUrl(next?: string, reason?: string): string {
  const params = new URLSearchParams({ auth: "signin" });
  const safe = safeNext(next);
  if (safe) params.set("next", safe);
  if (reason) params.set("reason", reason);
  return `/?${params.toString()}`;
}

/**
 * Only same-site paths. `next` arrives from the query string, so without this
 * a crafted link could bounce a fresh sign-in to another origin.
 */
export function safeNext(next: string | null | undefined): string | undefined {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return undefined;
  }
  return next;
}

/** Copy for the `reason` codes the server can attach. */
export const SIGN_IN_REASONS: Record<string, string> = {
  "step-up": "The admin console needs a password sign-in. Sign in with your password to continue.",
  admin: "Sign in to open the admin console.",
  team: "Sign in to open the musicians' area.",
};
