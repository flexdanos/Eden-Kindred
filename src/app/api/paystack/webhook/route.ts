import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { donations, pledgePeriods, pledges, webhookEvents } from "@/lib/db/schema";
import { verifyTransaction, verifyWebhookSignature } from "@/lib/paystack";

// Node runtime: the signature check needs node:crypto, and we must read the
// body as an unparsed string.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaystackWebhookBody = {
  event: string;
  data: { id?: number; reference?: string; [k: string]: unknown };
};

const MOMO_BANK_TO_NETWORK: Record<string, "mtn" | "vod" | "atl"> = {
  MTN: "mtn",
  "MTN MOMO": "mtn",
  VODAFONE: "vod",
  TELECEL: "vod",
  AIRTELTIGO: "atl",
  "AIRTEL/TIGO": "atl",
  ATL: "atl",
};

function toNetwork(bank: string | null | undefined) {
  if (!bank) return null;
  return MOMO_BANK_TO_NETWORK[bank.trim().toUpperCase()] ?? null;
}

export async function POST(req: Request) {
  // 1. RAW body. Do not req.json() here — re-serialising changes key order and
  //    whitespace, and the HMAC will never match.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    // 401 rather than 400: this is an authentication failure, and Paystack
    // should not retry a request we will never accept.
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: PaystackWebhookBody;
  try {
    body = JSON.parse(rawBody) as PaystackWebhookBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const reference = body.data?.reference;
  const eventId = `${body.event}:${body.data?.id ?? reference ?? "unknown"}`;

  // 2. Dedupe. Paystack retries on any non-2xx and on timeouts, so the same
  //    delivery arrives more than once as a matter of course.
  const inserted = await db
    .insert(webhookEvents)
    .values({
      provider: "paystack",
      eventId,
      eventType: body.event,
      payload: body as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.eventId] })
    .returning({ id: webhookEvents.id });

  if (inserted.length === 0) {
    // Already handled. 200 so Paystack stops retrying.
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (body.event !== "charge.success" || !reference) {
    // Acknowledge everything else so it isn't retried forever.
    return NextResponse.json({ received: true, ignored: body.event });
  }

  // 3. Verify against Paystack before trusting a single figure in the payload.
  //    A valid signature proves Paystack sent this. It does not prove the
  //    amount is what was actually collected.
  let txn;
  try {
    txn = await verifyTransaction(reference);
  } catch (error) {
    console.error("[paystack] verify failed", { reference, error });
    // 500 so Paystack retries — this is very likely a transient network fault,
    // and the dedupe row is removed below so the retry can proceed.
    await db.delete(webhookEvents).where(eq(webhookEvents.eventId, eventId));
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }

  const [existing] = await db
    .select({
      id: donations.id,
      amountMinor: donations.amountMinor,
      pledgeId: donations.pledgeId,
      pledgePeriodId: donations.pledgePeriodId,
    })
    .from(donations)
    .where(
      and(eq(donations.provider, "paystack"), eq(donations.providerReference, reference)),
    )
    .limit(1);

  if (!existing) {
    // A charge with no pending row shouldn't happen — the give flow always
    // writes one first. Log loudly rather than silently discarding money.
    console.error("[paystack] charge.success for unknown reference", { reference });
    return NextResponse.json({ received: true, orphaned: true });
  }

  // 4. Amount mismatch means the client tampered with the initialise call, or
  //    a tier price changed mid-flight. Record the truth and flag it.
  if (txn.amount !== existing.amountMinor) {
    console.error("[paystack] amount mismatch", {
      reference,
      expected: existing.amountMinor,
      actual: txn.amount,
    });
  }

  const succeeded = txn.status === "success";

  await db
    .update(donations)
    .set({
      status: succeeded ? "succeeded" : "failed",
      amountMinor: txn.amount,
      channel: txn.channel ?? txn.authorization?.channel ?? null,
      momoNetwork: toNetwork(txn.authorization?.bank),
      donorPhone: txn.authorization?.mobile_money_number ?? null,
      paidAt: txn.paid_at ? new Date(txn.paid_at) : new Date(),
      raw: txn as unknown as Record<string, unknown>,
    })
    .where(eq(donations.id, existing.id));

  // 5. Settle the pledge window this gift answered, and schedule the next one.
  if (succeeded && existing.pledgePeriodId) {
    await db
      .update(pledgePeriods)
      .set({ status: "fulfilled" })
      .where(eq(pledgePeriods.id, existing.pledgePeriodId));
  }

  if (succeeded && existing.pledgeId) {
    const [pledge] = await db
      .select({ cadence: pledges.cadence })
      .from(pledges)
      .where(eq(pledges.id, existing.pledgeId))
      .limit(1);

    if (pledge) {
      const next = new Date();
      if (pledge.cadence === "monthly") next.setMonth(next.getMonth() + 1);
      else if (pledge.cadence === "quarterly") next.setMonth(next.getMonth() + 3);
      else next.setFullYear(next.getFullYear() + 1);

      await db
        .update(pledges)
        .set({ nextReminderAt: next })
        .where(eq(pledges.id, existing.pledgeId));
    }
  }

  return NextResponse.json({ received: true });
}
