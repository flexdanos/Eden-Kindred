"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AuthUser = { id: string; email: string | null };

/**
 * The signed-in user, resolved in the browser.
 *
 * Three states, and the distinction carries weight: `undefined` means the
 * check has not come back yet, `null` means signed out. Collapsing them makes
 * every consumer flash its signed-out UI — a "Sign in" link, a join button —
 * at someone who is already signed in, on every page load.
 *
 * Resolved client-side on purpose. The public pages are ISR with a five-minute
 * window; reading the session cookie in a server layout would force all of them
 * to render dynamically and throw that caching away. The cost is a brief
 * unresolved moment, which callers should hold space for rather than fill with
 * the wrong answer.
 */
export function useAuthUser(): AuthUser | null | undefined {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    const toUser = (u: { id: string; email?: string } | null | undefined): AuthUser | null =>
      u ? { id: u.id, email: u.email ?? null } : null;

    supabase.auth.getUser().then(({ data }) => setUser(toUser(data.user)));

    // Fires the moment the auth modal verifies a code, so everything using this
    // updates together without a page reload.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(toUser(session?.user)),
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  return user;
}
