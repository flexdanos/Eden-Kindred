"use server";

import { z } from "zod";
import { addMonths, addQuarters, addYears, startOfMonth } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { donations, partnershipTiers, pledgePeriods, pledges } from "@/lib/db/schema";
import { initializeMomoCharge, newReference } from "@/lib/paystack";
import { normalizeGhanaPhone, toMinor } from "@/lib/money";
import { getSessionUser } from "@/lib/auth/guard";

const MIN_MINOR = 100; //   ₵1
const MAX_MINOR = 100_000_00; // ₵100,000 — a sanity ceiling, not a policy

const giveSchema = z.object({
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => {
      try {
        const m = toMinor(v);
        return m >= MIN_MINOR && m <= MAX_MINOR;
      } catch {
        return false;
      }
    }, "Enter an amount between ₵1 and ₵100,000"),
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter an email so we can send your receipt"),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeGhanaPhone(v) !== null, "Enter a valid Ghana mobile number"),
  // A pledge is a standing intent plus a reminder schedule. It is NOT an
  // auto-debit: Ghana MoMo has no reusable authorisation, so every future gift
  // needs the partner to approve a fresh prompt. The UI must say so.
  recurring: z.enum(["once", "monthly", "quarterly", "annual"]).default("once"),
  tierId: z.string().uuid().optional().or(z.literal("")),
  showPublicly: z.union([z.literal("on"), z.literal("")]).optional(),
  campaignSlug: z.string().max(80).optional().or(z.literal("")),
});

export type GiveState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectUrl?: string;
};

export async function startGiving(
  _prev: GiveState,
  formData: FormData,
): Promise<GiveState> {
  const parsed = giveSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const input = parsed.data;
  const amountMinor = toMinor(input.amount);
  const phone = normalizeGhanaPhone(input.phone)!;
  const user = await getSessionUser();

  // If a tier was chosen, the tier's amount wins over anything the form posted.
  // Never let a client-supplied figure decide what a named tier costs.
  let amount = amountMinor;
  let tierId: string | null = null;

  if (input.tierId) {
    const [tier] = await db
      .select({ id: partnershipTiers.id, amountMinor: partnershipTiers.amountMinor })
      .from(partnershipTiers)
      .where(eq(partnershipTiers.id, input.tierId))
      .limit(1);

    if (!tier) return { ok: false, error: "That partnership tier is no longer available." };
    amount = tier.amountMinor;
    tierId = tier.id;
  }

  const reference = newReference();
  const isPledge = input.recurring !== "once";

  try {
    let pledgeId: string | null = null;
    let pledgePeriodId: string | null = null;

    if (isPledge) {
      const cadence = input.recurring as "monthly" | "quarterly" | "annual";
      const now = new Date();
      const nextReminder =
        cadence === "monthly"
          ? addMonths(now, 1)
          : cadence === "quarterly"
            ? addQuarters(now, 1)
            : addYears(now, 1);

      const [pledge] = await db
        .insert(pledges)
        .values({
          profileId: user?.id ?? null,
          tierId,
          amountMinor: amount,
          cadence,
          status: "active",
          partnerName: input.name,
          partnerEmail: input.email,
          partnerPhone: phone,
          nextReminderAt: nextReminder,
        })
        .returning({ id: pledges.id });

      pledgeId = pledge.id;

      // The window this first gift settles.
      const [period] = await db
        .insert(pledgePeriods)
        .values({
          pledgeId: pledge.id,
          periodStart: startOfMonth(now).toISOString().slice(0, 10),
          dueAt: now,
          amountMinorExpected: amount,
          status: "pending",
        })
        .returning({ id: pledgePeriods.id });

      pledgePeriodId = period.id;
    }

    // Write the pending row BEFORE talking to Paystack. If initialize succeeds
    // but this insert had failed, the webhook would arrive for a reference we
    // have no record of and the gift would be orphaned.
    await db.insert(donations).values({
      donorProfileId: user?.id ?? null,
      donorEmail: input.email,
      donorName: input.name,
      donorPhone: phone,
      amountMinor: amount,
      type: isPledge ? "pledge" : "one_time",
      status: "pending",
      provider: "paystack",
      providerReference: reference,
      channel: "mobile_money",
      pledgeId,
      pledgePeriodId,
      campaignSlug: input.campaignSlug || null,
      isPublicDisplay: input.showPublicly === "on",
    });

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const init = await initializeMomoCharge({
      email: input.email,
      amountMinor: amount,
      reference,
      callbackUrl: `${site}/give/thank-you`,
      metadata: {
        partner_name: input.name,
        phone,
        cadence: input.recurring,
        pledge_id: pledgeId,
        custom_fields: [
          { display_name: "Partner", variable_name: "partner", value: input.name },
        ],
      },
    });

    return { ok: true, redirectUrl: init.authorization_url };
  } catch (error) {
    console.error("[give] failed to start charge", { reference, error });
    return {
      ok: false,
      error:
        "We couldn't reach the payment service just now. Your gift was not taken — please try again in a moment.",
    };
  }
}
