/**
 * Resolves the Supabase public credentials.
 *
 * Supabase renamed its keys: the old "anon (public)" JWT is now a PUBLISHABLE
 * key (`sb_publishable_…`) and "service_role" is now a SECRET key
 * (`sb_secret_…`). The dashboard shows the new names, so anyone copying values
 * across reasonably writes `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — while most
 * documentation and starter code still says `ANON_KEY`.
 *
 * Both are accepted. The alternative is a blank sign-in page and no error worth
 * reading, because these are only dereferenced deep inside the Supabase client.
 *
 * Note these MUST be referenced as full literal `process.env.X` expressions:
 * Next.js inlines NEXT_PUBLIC_ values at build time by textual substitution, so
 * computed lookups resolve to undefined in the browser.
 */

export function getSupabasePublicEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;
  return { url, key };
}

/** Throwing variant, for call sites that cannot meaningfully carry on. */
export function requireSupabasePublicEnv(): { url: string; key: string } {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (or …_PUBLISHABLE_KEY) in .env.",
    );
  }
  return env;
}
