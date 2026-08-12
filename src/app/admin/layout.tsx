import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { assertStaff } from "@/lib/auth/guard";
import { signOut } from "./actions";

/**
 * The admin is the PRODUCT register and follows different rules from the
 * public site: one type family, a fixed rem scale rather than fluid clamps,
 * restrained colour, and motion only where it conveys state. It shares tokens
 * with the brand so the two read as one system, but none of the drama.
 *
 * assertStaff() here is the real gate. Middleware only checks that a session
 * exists; role is checked in this Server Component because Drizzle bypasses
 * RLS entirely and a policy will not save us.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await assertStaff();

  return (
    <div className="flex min-h-svh font-body">
      <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between border-r border-border bg-sidebar p-4">
        <div>
          <Link href="/admin" className="block px-3 py-2 no-underline">
            <span className="font-display text-lg leading-none">
              Eden <em>Kindred</em>
            </span>
            <span className="mt-0.5 block text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
              Admin
            </span>
          </Link>

          <div className="mt-6">
            <AdminNav />
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="px-3 pb-2">
            <p className="m-0 truncate text-sm font-medium">
              {user.fullName ?? user.email}
            </p>
            <p className="m-0 text-xs capitalize text-muted-foreground">{user.role}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm no-underline text-foreground/75 transition-colors duration-150 hover:bg-accent hover:text-foreground"
          >
            <ExternalLink size={15} aria-hidden />
            View site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-foreground/75 transition-colors duration-150 hover:bg-accent hover:text-foreground"
            >
              <LogOut size={15} aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile bar — the sidebar collapses structurally rather than the
            type shrinking. */}
        <div className="md:hidden flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
          <Link href="/admin" className="font-display text-base no-underline">
            Eden <em>Kindred</em> Admin
          </Link>
          <form action={signOut}>
            <button type="submit" aria-label="Sign out" className="p-1.5">
              <LogOut size={16} aria-hidden />
            </button>
          </form>
        </div>

        <div className="md:hidden border-b border-border bg-sidebar px-4 py-3 overflow-x-auto">
          <AdminNav />
        </div>

        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
