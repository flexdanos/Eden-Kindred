"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/components/auth/use-auth-user";

/**
 * A floating round button on the public site that jumps straight to /admin.
 *
 * Shown only to signed-in staff — admins and editors, the roles assertStaff()
 * lets into the console. Everyone else, including signed-out visitors and
 * local development without a session, never sees it. This is a convenience,
 * not a gate: assertStaff() on the admin side still decides who
 * gets in, so a member who unhid it would just be bounced.
 *
 * Resolved in the browser for the same reason as useAuthUser — reading the
 * session in the server layout would make every ISR page dynamic. The role
 * comes from the "profiles: read own" RLS policy.
 */
export function AdminShortcut() {
  const user = useAuthUser();
  // Keyed by user id so a sign-out (or a switch of account) hides the button
  // without having to reset state inside the effect.
  const [staffId, setStaffId] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const isStaff = userId !== null && staffId === userId;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    createClient()
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setStaffId(data?.role === "admin" || data?.role === "editor" ? userId : null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!isStaff) return null;

  return (
    <Link
      href="/admin"
      aria-label="Open the admin console"
      title="Admin"
      className="fixed right-5 bottom-5 z-(--z-sticky) inline-flex size-12 items-center justify-center rounded-full bg-brand text-chalk shadow-lg transition-transform duration-(--dur-fast) hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
    >
      <LayoutDashboard size={20} aria-hidden />
    </Link>
  );
}
