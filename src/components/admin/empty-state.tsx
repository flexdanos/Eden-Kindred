import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Empty states teach the interface rather than announcing absence.
 *
 * "No gifts yet" alone tells an admin nothing. Explaining that records only
 * appear after Paystack confirms a handset approval tells them why the table
 * is empty and what to expect — which is the difference between an empty state
 * and a dead end.
 */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-3 border border-dashed border-border px-6 py-10 text-center">
      <h3 className="m-0 text-sm font-semibold">{title}</h3>
      <p className="mx-auto m-0 mt-2 max-w-[52ch] text-sm text-muted-foreground">{body}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center gap-1.5 text-sm no-underline text-primary hover:underline underline-offset-2"
        >
          {action.label}
          <ArrowRight size={13} aria-hidden />
        </Link>
      )}
    </div>
  );
}
