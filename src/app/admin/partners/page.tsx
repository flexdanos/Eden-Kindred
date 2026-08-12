import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { getPledgeFulfilment } from "@/lib/db/queries/admin";
import { formatMinor } from "@/lib/money";
import { PledgePill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});

export default async function PartnersPage() {
  await assertStaff();
  const partners = await safe("admin-partners", () => getPledgeFulfilment(200), []);

  return (
    <div className="max-w-6xl">
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">Partners</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Pledges are commitments plus a reminder schedule, not standing debits — Ghana
          mobile money has no reusable authorisation. &ldquo;Kept&rdquo; counts the windows
          a partner actually gave in.
        </p>
      </header>

      {partners.length === 0 ? (
        <EmptyState
          title="No partners yet"
          body="When someone chooses a monthly, quarterly, or yearly amount on the giving page, they appear here with a record of every window they have kept or missed."
          action={{ href: "/admin/tiers", label: "Set up partnership tiers" }}
        />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <caption className="sr-only">
              Active and past partners with pledge fulfilment
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">Partner</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Pledge</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Kept</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Missed</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Next reminder</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="block">{p.partnerName ?? "—"}</span>
                    {p.partnerPhone && (
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {p.partnerPhone}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {formatMinor(p.amountMinor)}
                    <span className="text-muted-foreground"> / {p.cadence}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <PledgePill status={p.status} />
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {p.periodsFulfilled}
                    <span className="text-muted-foreground"> of {p.periodsDue}</span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {p.periodsMissed > 0 ? (
                      <span className="text-primary font-medium">{p.periodsMissed}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                    {p.nextReminderAt ? dateFmt.format(p.nextReminderAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
