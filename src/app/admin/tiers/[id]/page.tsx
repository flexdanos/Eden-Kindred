import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { assertAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { partnershipTiers } from "@/lib/db/schema";
import { safe } from "@/lib/db/safe";
import { BackLink, TierEditor } from "./tier-editor";

export const dynamic = "force-dynamic";

export default async function TierEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Tiers set what people are asked to give, so this one is admin-only.
  await assertAdmin();
  const { id } = await params;

  const isNew = id === "new";
  const tier = isNew
    ? null
    : await safe(
        "admin-tier",
        async () => {
          const [row] = await db
            .select()
            .from(partnershipTiers)
            .where(eq(partnershipTiers.id, id))
            .limit(1);
          return row ?? null;
        },
        null,
      );

  if (!isNew && !tier) notFound();

  return (
    <div className="max-w-5xl">
      <BackLink />
      <h1 className="m-0 mt-3 mb-6 text-2xl font-semibold tracking-tight">
        {isNew ? "New tier" : tier!.name}
      </h1>
      <TierEditor
        tier={
          tier
            ? {
                id: tier.id,
                name: tier.name,
                description: tier.description,
                amountMinor: tier.amountMinor,
                cadence: tier.cadence,
                sortOrder: tier.sortOrder,
                isActive: tier.isActive,
              }
            : null
        }
      />
    </div>
  );
}
