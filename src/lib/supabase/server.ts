import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicEnv } from "./env";

/**
 * Server Supabase client — anon key, RLS enforced, carries the user's session.
 *
 * This is the client that answers "who is logged in". It is NOT the client that
 * reads or writes content; that is Drizzle.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const { url, key } = requireSupabasePublicEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Session refresh is handled by middleware, so this is safe to swallow.
        }
      },
    },
  });
}
