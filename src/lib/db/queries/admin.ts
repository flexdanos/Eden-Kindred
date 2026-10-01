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

  // One statement, not five in parallel. Each parallel query takes its own
  // pooled connection: in dev that drained the whole pool, so a single wedged
  // connection hung the dashboard for minutes; in production (max: 1) the
  // five just queued behind each other anyway.
  const [row] = await db
    .select({
      receivedThisMonthMinor: sql<number>`(
        select coalesce(sum(${donations.amountMinor}), 0) from ${donations}
        where ${donations.status} = 'succeeded' and ${donations.paidAt} >= ${monthStart.toISOString()}
      )`.mapWith(Number),
      giftsThisMonth: sql<number>`(
        select count(*) from ${donations}
        where ${donations.status} = 'succeeded' and ${donations.paidAt} >= ${monthStart.toISOString()}
      )`.mapWith(Number),
      receivedAllTimeMinor: sql<number>`(
        select coalesce(sum(${donations.amountMinor}), 0) from ${donations}
        where ${donations.status} = 'succeeded'
      )`.mapWith(Number),
      activePartners: sql<number>`(
        select count(*) from ${pledges} where ${pledges.status} = 'active'
      )`.mapWith(Number),
      // Normalise every cadence to a monthly figure so the number means one
      // thing. A yearly pledge of ₵1,200 is ₵100/month of committed support.
      pledgedMonthlyMinor: sql<number>`(
        select coalesce(sum(
          case ${pledges.cadence}
            when 'monthly' then ${pledges.amountMinor}
            when 'quarterly' then ${pledges.amountMinor} / 3
            when 'annual' then ${pledges.amountMinor} / 12
          end
        ), 0) from ${pledges} where ${pledges.status} = 'active'
      )`.mapWith(Number),
      missedPeriods: sql<number>`(
        select count(*) from ${pledgePeriods} where ${pledgePeriods.status} = 'missed'
      )`.mapWith(Number),
    })
    .from(sql`(select 1) as one`);

  return {
    receivedThisMonthMinor: row?.receivedThisMonthMinor ?? 0,
    receivedAllTimeMinor: row?.receivedAllTimeMinor ?? 0,
    giftsThisMonth: row?.giftsThisMonth ?? 0,
    activePartners: row?.activePartners ?? 0,
    pledgedMonthlyMinor: row?.pledgedMonthlyMinor ?? 0,
    missedPeriods: row?.missedPeriods ?? 0,
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

/** Counts for the admin sidebar, including unpublished drafts. One statement, for the reason given in getDashboardTotals. */
export async function getContentCounts() {
  const [row] = await db
    .select({
      postsTotal: sql<number>`(select count(*) from ${posts})`.mapWith(Number),
      postsDrafts: sql<number>`(select count(*) from ${posts} where ${posts.isPublished} = false)`.mapWith(Number),
      eventsTotal: sql<number>`(select count(*) from ${events})`.mapWith(Number),
      eventsDrafts: sql<number>`(select count(*) from ${events} where ${events.isPublished} = false)`.mapWith(Number),
      blocksTotal: sql<number>`(select count(*) from ${contentBlocks})`.mapWith(Number),
      blocksDrafts: sql<number>`(select count(*) from ${contentBlocks} where ${contentBlocks.isPublished} = false)`.mapWith(Number),
    })
    .from(sql`(select 1) as one`);

  return {
    posts: { total: row?.postsTotal ?? 0, drafts: row?.postsDrafts ?? 0 },
    events: { total: row?.eventsTotal ?? 0, drafts: row?.eventsDrafts ?? 0 },
    blocks: { total: row?.blocksTotal ?? 0, drafts: row?.blocksDrafts ?? 0 },
  };
}
