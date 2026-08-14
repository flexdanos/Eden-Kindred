import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { getRecentDonations } from "@/lib/db/queries/admin";
import { formatMinor } from "@/lib/money";
import { StatusPill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";
import { ManualGiftForm } from "./manual-gift-form";

export const dynamic = "force-dynamic";

const NETWORK_LABEL: Record<string, string> = {
  mtn: "MTN MoMo",
  vod: "Telecel Cash",
  atl: "AirtelTigo",
};

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
});

export default async function DonationsPage() {
  await assertStaff();
  const donations = await safe("admin-donations", () => getRecentDonations(200), []);

  return (
    <div className="max-w-6xl 2xl:max-w-none">
      {/* Uncapped past 2xl: this table has seven columns and horizontal scroll
          below that. On a wide monitor the whole row should be readable at
          once rather than capped for a measure that only matters to prose. */}
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">Donations</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Every gift, including ones that never completed. Records are written by the
          Paystack webhook after it verifies the charge — not when the form is submitted.
        </p>
      </header>

      <details className="mb-8 border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          Record a gift that arrived by bank transfer, Zelle, or Cash App
        </summary>
        <div className="border-t border-border p-5">
          <p className="m-0 mb-5 max-w-[60ch] text-sm text-muted-foreground">
            Those rails cannot notify this site — Zelle has no merchant API, and the others
            need a merchant account. Anything received that way has to be entered here, or
            the totals above will understate what actually came in.
          </p>
          <ManualGiftForm />
        </div>
      </details>

      {donations.length === 0 ? (
        <EmptyState
          title="No donations recorded"
          body="A row appears here the moment Paystack confirms a mobile money approval. Pending rows mean the giver started a payment but hasn't approved the prompt on their handset yet."
          action={{ href: "/give", label: "Open the giving page" }}
        />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <caption className="sr-only">
              All donations, newest first, with status and mobile money network
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">Partner</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Amount</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Network</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Reference</th>
                <th scope="col" className="px-4 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((gift) => (
                <tr key={gift.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="block">{gift.donorName ?? "—"}</span>
                    {gift.donorPhone && (
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {gift.donorPhone}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-medium">
                    {formatMinor(gift.amountMinor)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {gift.type === "pledge" ? "Pledge" : "One-off"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {gift.momoNetwork ? NETWORK_LABEL[gift.momoNetwork] : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusPill status={gift.status} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {gift.providerReference}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                    {dateFmt.format(gift.paidAt ?? gift.createdAt)}
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
