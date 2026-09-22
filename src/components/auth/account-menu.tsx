"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The signed-in affordance in the header.
 *
 * Replaces what used to be the only signal that anyone was signed in: a small
 * low-contrast text link flipping between "Sign in" and "Sign out", sitting
 * beside a prominent "Join us" button that never changed. That failed twice
 * over — it was easy to miss entirely, and even when noticed it never said
 * WHICH account you were in as. "Signed in" and "signed in as you" are
 * different questions and people ask the second one.
 *
 * A marked control with the account's initial answers both at a glance.
 */

/** First letter of the name, else of the email. Falls back to an icon. */
function initialOf(email: string | null, name: string | null): string | null {
  const source = name?.trim() || email?.trim();
  const first = source?.[0];
  return first ? first.toUpperCase() : null;
}

export function AccountMenu({
  email,
  name,
  onSignOut,
}: {
  email: string | null;
  name?: string | null;
  onSignOut: () => void;
}) {
  const initial = initialOf(email, name ?? null);
  const label = name?.trim() || email || "Your account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${label}`}
        className="inline-flex size-9 items-center justify-center rounded-full bg-brand text-chalk text-step--1 font-semibold transition-transform duration-(--dur-fast) hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        {initial ?? <User size={16} aria-hidden />}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        {/* A plain block, not DropdownMenuLabel. That component renders Base
            UI's Menu.GroupLabel, which throws unless it sits inside a
            Menu.Group — and a group label is the wrong semantics anyway: this
            heads the menu, it does not label a set of items below it. */}
        <div className="px-2 py-1.5">
          <span className="block text-xs text-muted-foreground">Signed in as</span>
          {/* The email can be long; wrap rather than truncate so the person can
              actually verify which account this is — the whole point here. */}
          <span className="mt-0.5 block break-all text-sm font-medium">{label}</span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/partnership" />}>
          Your partnership
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSignOut}>
          <LogOut size={14} aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
