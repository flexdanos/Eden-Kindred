import "server-only";

import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { donations, pledgePeriods, pledges, posts, events, contentBlocks } from "@/lib/db/schema";

/**
 * Admin dashboard aggregates.
 *
 * This file is the concrete reason the project runs Drizzle rather than the
 * Supabase client alone: PostgREST can't express SUM/GROUP BY, so every query
 * below would otherwise be a hand-written Postgres RPC function called without
 * types. Here they're typed, colocated, and readable.
 */

export type DashboardTotals = {
  receivedThisMonthMinor: number;
  receivedAllTimeMinor: number;
  giftsThisMonth: number;
  activePartners: number;
  /** What active pledges commit to per month, normalised across cadences. */
  pledgedMonthlyMinor: number;
  /** Pledge windows that came due and were never settled. */
  missedPeriods: number;
};

function startOfThisMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function getDashboardTotals(): Promise<DashboardTotals> {
  const monthStart = startOfThisMonth();

  const [thisMonth, allTime, partners, pledged, missed] = await Promise.all([
    db
      .select({
        total: sum(donations.amountMinor).mapWith(Number),
        gifts: count(),
      })
      .from(donations)
      .where(and(eq(donations.status, "succeeded"), gte(donations.paidAt, monthStart))),

    db
      .select({ total: sum(donations.amountMinor).mapWith(Number) })
      .from(donations)
      .where(eq(donations.status, "succeeded")),

    db
      .select({ n: count() })
      .from(pledges)
      .where(eq(pledges.status, "active")),

    // Normalise every cadence to a monthly figure so the number means one
    // thing. A yearly pledge of ₵1,200 is ₵100/month of committed support.
    db
      .select({
        total: sql<number>`coalesce(sum(
          case ${pledges.cadence}
            when 'monthly' then ${pledges.amountMinor}
            when 'quarterly' then ${pledges.amountMinor} / 3
            when 'annual' then ${pledges.amountMinor} / 12
          end
        ), 0)`.mapWith(Number),
      })
      .from(pledges)
      .where(eq(pledges.status, "active")),

    db
      .select({ n: count() })
      .from(pledgePeriods)
      .where(eq(pledgePeriods.status, "missed")),
  ]);

  return {
    receivedThisMonthMinor: thisMonth[0]?.total ?? 0,
    receivedAllTimeMinor: allTime[0]?.total ?? 0,
    giftsThisMonth: thisMonth[0]?.gifts ?? 0,
    activePartners: partners[0]?.n ?? 0,
    pledgedMonthlyMinor: pledged[0]?.total ?? 0,
    missedPeriods: missed[0]?.n ?? 0,
  };
}

/** Received per month for the last N months, oldest first. */
export async function getMonthlySeries(months = 12) {
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${donations.paidAt}), 'YYYY-MM')`,
      totalMinor: sum(donations.amountMinor).mapWith(Number),
      gifts: count(),
    })
    .from(donations)
    .where(
      and(
        eq(donations.status, "succeeded"),
        gte(donations.paidAt, sql`now() - (${months}::text || ' months')::interval`),
      ),
    )
    .groupBy(sql`date_trunc('month', ${donations.paidAt})`)
    .orderBy(sql`date_trunc('month', ${donations.paidAt})`);

  return rows;
}

/**
 * Pledged vs actually received, per active pledge. The view the pledge model
 * exists to make possible — and the one a subscriptions table couldn't give.
 */
export async function getPledgeFulfilment(limit = 50) {
  return db
    .select({
      id: pledges.id,
      partnerName: pledges.partnerName,
      partnerPhone: pledges.partnerPhone,
      amountMinor: pledges.amountMinor,
      cadence: pledges.cadence,
      status: pledges.status,
      nextReminderAt: pledges.nextReminderAt,
      periodsDue: sql<number>`count(${pledgePeriods.id})`.mapWith(Number),
      periodsFulfilled: sql<number>`count(*) filter (where ${pledgePeriods.status} = 'fulfilled')`.mapWith(
        Number,
      ),
      periodsMissed: sql<number>`count(*) filter (where ${pledgePeriods.status} = 'missed')`.mapWith(
        Number,
      ),
    })
    .from(pledges)
    .leftJoin(pledgePeriods, eq(pledgePeriods.pledgeId, pledges.id))
    .groupBy(pledges.id)
    .orderBy(desc(pledges.createdAt))
    .limit(limit);
}

export async function getRecentDonations(limit = 25) {
  return db
    .select({
      id: donations.id,
      donorName: donations.donorName,
      donorPhone: donations.donorPhone,
      amountMinor: donations.amountMinor,
      status: donations.status,
      type: donations.type,
      momoNetwork: donations.momoNetwork,
      providerReference: donations.providerReference,
      paidAt: donations.paidAt,
      createdAt: donations.createdAt,
    })
    .from(donations)
    .orderBy(desc(donations.createdAt))
    .limit(limit);
}

/** Counts for the admin sidebar, including unpublished drafts. */
export async function getContentCounts() {
  const [postRows, eventRows, blockRows] = await Promise.all([
    db
      .select({
        total: count(),
        drafts: sql<number>`count(*) filter (where ${posts.isPublished} = false)`.mapWith(Number),
      })
      .from(posts),
    db
      .select({
        total: count(),
        drafts: sql<number>`count(*) filter (where ${events.isPublished} = false)`.mapWith(Number),
      })
      .from(events),
    db
      .select({
        total: count(),
        drafts: sql<number>`count(*) filter (where ${contentBlocks.isPublished} = false)`.mapWith(
          Number,
        ),
      })
      .from(contentBlocks),
  ]);

  return {
    posts: postRows[0] ?? { total: 0, drafts: 0 },
    events: eventRows[0] ?? { total: 0, drafts: 0 },
    blocks: blockRows[0] ?? { total: 0, drafts: 0 },
  };
}
