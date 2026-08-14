import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listEvents, listMediaAssets, listTeamResources } from "@/lib/db/queries/admin-lists";
import { deleteTeamResource } from "@/app/admin/mutations";
import { EmptyState } from "@/components/admin/empty-state";
import { TeamResourceForm } from "./team-form";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  chord_chart: "Chord chart",
  rehearsal_audio: "Rehearsal audio",
  setlist: "Setlist",
  note: "Note",
};

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminTeamPage() {
  await assertStaff();

  const [resources, assets, events] = await Promise.all([
    safe("admin-team", () => listTeamResources(), []),
    safe("admin-media", () => listMediaAssets(), []),
    safe("admin-events", () => listEvents(), []),
  ]);

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">Musicians&apos; area</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Charts, rehearsal audio, and setlists for the team. Visible at{" "}
          <code className="text-xs">/team</code> to anyone marked as a team member — and to
          admins and editors.
        </p>
        <p className="m-0 mt-2 text-sm text-muted-foreground">
          Mark someone as a team member by setting <code className="text-xs">is_team_member</code>{" "}
          on their profile row. A UI for that is not built yet.
        </p>
      </header>

      <section className="mb-10 border border-border p-5">
        <h2 className="m-0 mb-4 text-base font-semibold">Add something</h2>
        <TeamResourceForm
          assets={assets}
          events={events.map((e) => ({ id: e.id, title: e.title }))}
        />
      </section>

      <section>
        <h2 className="m-0 mb-3 text-base font-semibold">Everything shared</h2>

        {resources.length === 0 ? (
          <EmptyState
            title="Nothing shared yet"
            body="Add a setlist or a chart above and the team will see it the next time they open /team."
          />
        ) : (
          <ul className="list-none m-0 p-0 border border-border">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{resource.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {KIND_LABEL[resource.kind] ?? resource.kind}
                    {resource.eventTitle && ` · ${resource.eventTitle}`}
                    {` · added ${dateFmt.format(resource.createdAt)}`}
                  </span>
                </span>
                <form action={deleteTeamResource}>
                  <input type="hidden" name="id" value={resource.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-accent"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
