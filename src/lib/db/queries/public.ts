import "server-only";

import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { publicStorageUrl } from "@/lib/storage";
import {
  contentBlocks,
  donations,
  events,
  mediaAssets,
  partnershipTiers,
  posts,
  siteSettings,
} from "@/lib/db/schema";

/**
 * Reads for the public site. All of these run on the server through Drizzle, so
 * pages ship already populated — no client-side fetch waterfall on a phone.
 *
 * Every one of them filters on `is_published` / `is_active` in the query. RLS
 * enforces the same thing for the anon key, but Drizzle bypasses RLS, so the
 * filter here is the one that actually runs. Do not remove it.
 */

export type PublicMedia = { path: string; bucket: string; altText: string | null };

export function mediaUrl(media: PublicMedia | null | undefined): string | null {
  return media ? publicStorageUrl(media.bucket, media.path) : null;
}

/** A named, admin-editable section. Returns null when unpublished or absent. */
export async function getContentBlock(slug: string) {
  const [row] = await db
    .select({
      slug: contentBlocks.slug,
      title: contentBlocks.title,
      body: contentBlocks.body,
      data: contentBlocks.data,
      media: {
        path: mediaAssets.path,
        bucket: mediaAssets.bucket,
        altText: mediaAssets.altText,
      },
    })
    .from(contentBlocks)
    .leftJoin(mediaAssets, eq(contentBlocks.mediaId, mediaAssets.id))
    .where(and(eq(contentBlocks.slug, slug), eq(contentBlocks.isPublished, true)))
    .limit(1);

  return row ?? null;
}

export async function getPublishedPosts(limit = 12) {
  return db
    .select({
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      publishedAt: posts.publishedAt,
      media: {
        path: mediaAssets.path,
        bucket: mediaAssets.bucket,
        altText: mediaAssets.altText,
      },
    })
    .from(posts)
    .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
    .where(eq(posts.isPublished, true))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

export async function getPostBySlug(slug: string) {
  const [row] = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      body: posts.body,
      publishedAt: posts.publishedAt,
      media: {
        path: mediaAssets.path,
        bucket: mediaAssets.bucket,
        altText: mediaAssets.altText,
      },
    })
    .from(posts)
    .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
    .where(and(eq(posts.slug, slug), eq(posts.isPublished, true)))
    .limit(1);

  return row ?? null;
}

/** Gatherings that haven't finished yet, soonest first. */
export async function getUpcomingEvents(limit = 6) {
  return db
    .select({
      slug: events.slug,
      title: events.title,
      description: events.description,
      location: events.location,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      media: {
        path: mediaAssets.path,
        bucket: mediaAssets.bucket,
        altText: mediaAssets.altText,
      },
    })
    .from(events)
    .leftJoin(mediaAssets, eq(events.coverMediaId, mediaAssets.id))
    .where(and(eq(events.isPublished, true), gte(events.startsAt, new Date())))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

export async function getEventBySlug(slug: string) {
  const [row] = await db
    .select({
      slug: events.slug,
      title: events.title,
      description: events.description,
      location: events.location,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      media: {
        path: mediaAssets.path,
        bucket: mediaAssets.bucket,
        altText: mediaAssets.altText,
      },
    })
    .from(events)
    .leftJoin(mediaAssets, eq(events.coverMediaId, mediaAssets.id))
    .where(and(eq(events.slug, slug), eq(events.isPublished, true)))
    .limit(1);

  return row ?? null;
}

export async function getActiveTiers() {
  return db
    .select({
      id: partnershipTiers.id,
      name: partnershipTiers.name,
      description: partnershipTiers.description,
      amountMinor: partnershipTiers.amountMinor,
      cadence: partnershipTiers.cadence,
    })
    .from(partnershipTiers)
    .where(eq(partnershipTiers.isActive, true))
    .orderBy(asc(partnershipTiers.sortOrder));
}

/**
 * The public partners feed.
 *
 * Note what is NOT selected: no email, no phone, no amount, no provider
 * reference. `public_partners` in supabase/rls-policies.sql exists so the anon
 * key can't reach those columns either; this query is the server-side
 * equivalent of the same restraint. Keep them in step.
 */
export async function getPublicPartners(limit = 24) {
  return db
    .select({
      name: sql<string>`coalesce(nullif(trim(${donations.donorName}), ''), 'A partner')`,
      paidAt: donations.paidAt,
    })
    .from(donations)
    .where(and(eq(donations.isPublicDisplay, true), eq(donations.status, "succeeded")))
    .orderBy(desc(donations.paidAt))
    .limit(limit);
}

/** Site-wide admin toggles, as a plain object. */
export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const rows = await db
    .select({ key: siteSettings.key, value: siteSettings.value })
    .from(siteSettings);

  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
