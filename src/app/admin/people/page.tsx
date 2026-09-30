import Link from "next/link";
import { Plus } from "lucide-react";
import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listPeople } from "@/lib/db/queries/admin-lists";
import { PublishPill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  await assertStaff();
  const rows = await safe("admin-people", () => listPeople(), []);

  return (
    <div className="max-w-5xl 2xl:max-w-6xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">People</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            The names and faces on the public People page. Only add someone who has
            agreed to appear — nothing here is taken from sign-in accounts.
          </p>
        </div>
        <Link
          href="/admin/people/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors duration-150 hover:bg-[var(--brand-hover)]"
        >
          <Plus size={15} aria-hidden />
          Add a person
        </Link>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="No one added yet"
          body="Add the people a newcomer is likely to meet — whoever leads worship, teaches, or hosts a kinship group — and they appear on the public People page."
          action={{ href: "/admin/people/new", label: "Add the first person" }}
        />
      ) : (
        <ul className="list-none m-0 p-0 border border-border">
          {rows.map((person) => (
            <li key={person.id} className="border-b border-border last:border-0">
              <Link
                href={`/admin/people/${person.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 no-underline transition-colors duration-150 hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{person.name}</span>
                  {person.role && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {person.role}
                    </span>
                  )}
                </span>
                <PublishPill published={person.isPublished} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
