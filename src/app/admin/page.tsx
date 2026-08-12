import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import {
  getContentCounts,
  getDashboardTotals,
  getRecentDonations,
  type DashboardTotals,
} from "@/lib/db/queries/admin";
import { formatMinor } from "@/lib/money";
import { StatusPill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

const EMPTY_TOTALS: DashboardTotals = {
  receivedThisMonthMinor: 0,
  receivedAllTimeMinor: 0,
  giftsThisMonth: 0,
  activePartners: 0,
  pledgedMonthlyMinor: 0,
  missedPeriods: 0,
};

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
});

export default async function AdminDashboard() {
  await assertStaff();

  const [totals, recent, counts] = await Promise.all([
    safe("dashboard-totals", () => getDashboardTotals(), EMPTY_TOTALS),
    safe("recent-donations", () => getRecentDonations(8), []),
    safe(
      "content-counts",
      () => getContentCounts(),
      { posts: { total: 0, drafts: 0 }, events: { total: 0, drafts: 0 }, blocks: { total: 0, drafts: 0 } },
    ),
  ]);

  // The number the pledge model exists to produce: what partners committed to
  // this month against what actually arrived. A subscriptions table could not
  // tell you this, because on MoMo nothing charges itself.
  const fulfilment =
    totals.pledgedMonthlyMinor > 0
      ? Math.min(
          100,
          Math.round((totals.receivedThisMonthMinor / totals.pledgedMonthlyMinor) * 100),
        )
      : null;

  const stats = [
    { label: "Received this month", value: formatMinor(totals.receivedThisMonthMinor) },
    { label: "Pledged monthly", value: formatMinor(totals.pledgedMonthlyMinor) },
    { label: "Active partners", value: String(totals.activePartners) },
    { label: "Gifts this month", value: String(totals.giftsThisMonth) },
  ];

  const drafts = counts.posts.drafts + counts.events.drafts + counts.blocks.drafts;

  return (
    <div className="max-w-6xl">
      <header className="mb-7">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Giving and content at a glance. All amounts in Ghana cedis.
        </p>
      </header>

      <section aria-label="Key figures" className="grid gap-px bg-border border border-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-background p-4">
            <p className="m-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
            <p className="m-0 mt-1.5 text-xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Pledged vs received */}
      <section className="mt-6 border border-border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 text-base font-semibold">This month against pledges</h2>
          {fulfilment !== null && (
            <span className="text-sm tabular-nums text-muted-foreground">
              {fulfilment}% of {formatMinor(totals.pledgedMonthlyMinor)}
            </span>
          )}
        </div>

        {fulfilment === null ? (
          <p className="m-0 mt-3 text-sm text-muted-foreground">
            No active pledges yet. Once partners commit to a monthly amount, this shows how
            much of it has actually come in — which on mobile money is never automatic.
          </p>
        ) : (
          <>
            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={fulfilment}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Share of pledged giving received this month"
            >
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${fulfilment}%` }}
              />
            </div>
            <p className="m-0 mt-3 text-sm text-muted-foreground">
              {formatMinor(totals.receivedThisMonthMinor)} received of{" "}
              {formatMinor(totals.pledgedMonthlyMinor)} pledged.
            </p>
          </>
        )}

        {totals.missedPeriods > 0 && (
          <p className="mt-4 flex items-start gap-2 text-sm">
            <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-primary" />
            <span>
              {totals.missedPeriods} pledge {totals.missedPeriods === 1 ? "period" : "periods"}{" "}
              passed unfulfilled.{" "}
              <Link href="/admin/partners" className="underline underline-offset-2">
                Review partners
              </Link>
            </span>
          </p>
        )}
      </section>

      {/* Recent donations */}
      <section className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-base font-semibold">Recent gifts</h2>
          <Link
            href="/admin/donations"
            className="inline-flex items-center gap-1 text-sm no-underline text-muted-foreground hover:text-foreground"
          >
            All donations
            <ArrowRight size={13} aria-hidden />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No gifts yet"
            body="When someone gives, the record appears here within seconds of the mobile money prompt being approved. Nothing is written until Paystack confirms it."
            action={{ href: "/give", label: "Open the giving page" }}
          />
        ) : (
          <div className="mt-3 overflow-x-auto border border-border">
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th scope="col" className="px-4 py-2.5 font-medium">Partner</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Amount</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((gift) => (
                  <tr key={gift.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="block">{gift.donorName ?? "—"}</span>
                      {gift.donorPhone && (
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {gift.donorPhone}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {formatMinor(gift.amountMinor)}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-muted-foreground">
                      {gift.type === "pledge" ? "Pledge" : "One-off"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={gift.status} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {dateFmt.format(gift.paidAt ?? gift.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {drafts > 0 && (
        <section className="mt-6 border border-border p-5">
          <h2 className="m-0 text-base font-semibold">Unpublished</h2>
          <p className="m-0 mt-1.5 text-sm text-muted-foreground">
            {drafts} {drafts === 1 ? "item is" : "items are"} saved but not visible on the
            public site.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {counts.blocks.drafts > 0 && (
              <Link href="/admin/content" className="underline underline-offset-2">
                {counts.blocks.drafts} page sections
              </Link>
            )}
            {counts.posts.drafts > 0 && (
              <Link href="/admin/posts" className="underline underline-offset-2">
                {counts.posts.drafts} teaching posts
              </Link>
            )}
            {counts.events.drafts > 0 && (
              <Link href="/admin/events" className="underline underline-offset-2">
                {counts.events.drafts} gatherings
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
