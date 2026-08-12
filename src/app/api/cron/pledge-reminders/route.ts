import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { pledgePeriods, pledges } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens the next pledge window for every partner whose reminder has come due,
 * and marks unfulfilled past windows as missed.
 *
 * This job is the engine of the whole pledge model. Ghana mobile money has no
 * reusable authorisation, so nothing charges itself — a "monthly partner" is
 * only monthly because this runs and asks them.
 *
 * Schedule it daily. Vercel Cron:
 *   { "crons": [{ "path": "/api/cron/pledge-reminders", "schedule": "0 8 * * *" }] }
 * or pg_cron in Supabase hitting the same URL.
 *
 * Idempotent by construction: the unique index on (pledge_id, period_start)
 * means running it twice in a day opens no second window.
 */

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function addCadence(from: Date, cadence: "monthly" | "quarterly" | "annual"): Date {
  const next = new Date(from);
  if (cadence === "monthly") next.setMonth(next.getMonth() + 1);
  else if (cadence === "quarterly") next.setMonth(next.getMonth() + 3);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

export async function GET(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();

  // 1. Any window that fell due more than three days ago and was never paid is
  //    marked missed. The grace period exists because a partner who approves on
  //    the second of the month is not a defaulter.
  const graceCutoff = new Date(now);
  graceCutoff.setDate(graceCutoff.getDate() - 3);

  const missed = await db
    .update(pledgePeriods)
    .set({ status: "missed" })
    .where(and(eq(pledgePeriods.status, "pending"), lte(pledgePeriods.dueAt, graceCutoff)))
    .returning({ id: pledgePeriods.id });

  // 2. Open the next window for every active pledge that has come round.
  const due = await db
    .select({
      id: pledges.id,
      amountMinor: pledges.amountMinor,
      cadence: pledges.cadence,
      partnerEmail: pledges.partnerEmail,
      partnerName: pledges.partnerName,
      nextReminderAt: pledges.nextReminderAt,
    })
    .from(pledges)
    .where(and(eq(pledges.status, "active"), lte(pledges.nextReminderAt, now)));

  let opened = 0;

  for (const pledge of due) {
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    const inserted = await db
      .insert(pledgePeriods)
      .values({
        pledgeId: pledge.id,
        periodStart,
        dueAt: now,
        amountMinorExpected: pledge.amountMinor,
        status: "pending",
        reminderSentAt: now,
      })
      .onConflictDoNothing({
        target: [pledgePeriods.pledgeId, pledgePeriods.periodStart],
      })
      .returning({ id: pledgePeriods.id });

    if (inserted.length > 0) opened += 1;

    await db
      .update(pledges)
      .set({ nextReminderAt: addCadence(pledge.nextReminderAt ?? now, pledge.cadence) })
      .where(eq(pledges.id, pledge.id));

    // TODO(delivery): send the actual reminder. The row above is the durable
    // record that it is owed; delivery is deliberately a separate concern so a
    // failing email provider cannot corrupt pledge state. Wire an email or SMS
    // provider here and link to:
    //   /give?pledge=<pledge.id>&amount=<pledge.amountMinor>
    console.info("[cron] pledge window opened", {
      pledgeId: pledge.id,
      email: pledge.partnerEmail,
    });
  }

  return NextResponse.json({
    ok: true,
    ranAt: now.toISOString(),
    windowsOpened: opened,
    markedMissed: missed.length,
    pledgesConsidered: due.length,
  });
}
