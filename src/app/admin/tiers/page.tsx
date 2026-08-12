import Link from "next/link";
import { Plus } from "lucide-react";
import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listTiers } from "@/lib/db/queries/admin-lists";
import { formatMinor } from "@/lib/money";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

export default async function TiersPage() {
  await assertStaff();
  const tiers = await safe("admin-tiers", () => listTiers(), []);

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">Partnership tiers</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            Named giving levels shown on the giving page. A partner&apos;s pledge stores its
            own amount, so changing a tier price never rewrites what someone already
            agreed to.
          </p>
        </div>
        <Link
          href="/admin/tiers/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors duration-150 hover:bg-[var(--brand-hover)]"
        >
          <Plus size={15} aria-hidden />
          New tier
        </Link>
      </header>

      {tiers.length === 0 ? (
        <EmptyState
          title="No tiers set"
          body="Without tiers the giving page still works — people simply type their own amount. Tiers are for when you want to name and describe levels of partnership."
          action={{ href: "/admin/tiers/new", label: "Create a tier" }}
        />
      ) : (
        <ul className="list-none m-0 p-0 border border-border">
          {tiers.map((tier) => (
            <li key={tier.id} className="border-b border-border last:border-0">
              <Link
                href={`/admin/tiers/${tier.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 no-underline transition-colors duration-150 hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{tier.name}</span>
                  {tier.description && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {tier.description}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-sm">
                  <span className="tabular-nums">
                    {formatMinor(tier.amountMinor, { showDecimals: false })}
                    <span className="text-muted-foreground"> / {tier.cadence}</span>
                  </span>
                  {!tier.isActive && (
                    <span className="text-xs text-muted-foreground">Hidden</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
