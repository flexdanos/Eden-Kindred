import Link from "next/link";
import { Plus } from "lucide-react";
import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listPrograms } from "@/lib/db/queries/admin-lists";
import { PublishPill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
});

export default async function EventsPage() {
  await assertStaff();
  const events = await safe("admin-programs", () => listPrograms(), []);
  const now = new Date();

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">Programs</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            The next published program appears directly under the home page hero. Times
            display in Africa/Accra.
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors duration-150 hover:bg-[var(--brand-hover)]"
        >
          <Plus size={15} aria-hidden />
          New program
        </Link>
      </header>

      {events.length === 0 ? (
        <EmptyState
          title="Nothing scheduled"
          body="Until a program is published, the home page says programs are being scheduled rather than showing a stale date."
          action={{ href: "/admin/programs/new", label: "Schedule one" }}
        />
      ) : (
        <ul className="list-none m-0 p-0 border border-border">
          {events.map((event) => (
            <li key={event.id} className="border-b border-border last:border-0">
              <Link
                href={`/admin/programs/${event.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 no-underline transition-colors duration-150 hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{event.title}</span>
                  <span className="block truncate text-xs text-muted-foreground tabular-nums">
                    {dateFmt.format(event.startsAt)}
                    {event.location && ` · ${event.location}`}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  {event.startsAt < now && (
                    <span className="text-xs text-muted-foreground">Past</span>
                  )}
                  <PublishPill published={event.isPublished} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
