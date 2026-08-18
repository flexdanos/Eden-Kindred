import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnv } from "./env";

/**
 * Browser Supabase client — anon key, RLS enforced.
 *
 * Use for: auth flows, Storage uploads from the admin, Realtime subscriptions.
 * Do NOT use for reading content on public pages; those read through Drizzle on
 * the server so the markup ships already populated.
 */
export function createClient() {
  const { url, key } = requireSupabasePublicEnv();
  return createBrowserClient(url, key);
}
