import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contentBlocks,
  events,
  mediaAssets,
  partnershipTiers,
  posts,
  siteSettings,
} from "@/lib/db/schema";

/**
 * Admin list reads. Unlike the public queries these deliberately do NOT filter
 * on is_published — the whole point of the admin is seeing drafts.
 */

export async function listContentBlocks() {
  return db
    .select({
      id: contentBlocks.id,
      slug: contentBlocks.slug,
      title: contentBlocks.title,
      body: contentBlocks.body,
      isPublished: contentBlocks.isPublished,
      updatedAt: contentBlocks.updatedAt,
    })
    .from(contentBlocks)
    .orderBy(asc(contentBlocks.slug));
}

export async function getContentBlockById(id: string) {
  const [row] = await db.select().from(contentBlocks).where(eq(contentBlocks.id, id)).limit(1);
  return row ?? null;
}

export async function listPosts() {
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      isPublished: posts.isPublished,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt));
}

export async function getPostById(id: string) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function listEvents() {
  return db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      location: events.location,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      isPublished: events.isPublished,
    })
    .from(events)
    .orderBy(desc(events.startsAt));
}

export async function getEventById(id: string) {
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ?? null;
}

export async function listTiers() {
  return db
    .select()
    .from(partnershipTiers)
    .orderBy(asc(partnershipTiers.sortOrder), asc(partnershipTiers.name));
}

export async function listMediaAssets(limit = 200) {
  return db
    .select({
      id: mediaAssets.id,
      bucket: mediaAssets.bucket,
      path: mediaAssets.path,
      altText: mediaAssets.altText,
      width: mediaAssets.width,
      height: mediaAssets.height,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(limit);
}

export type AdminMediaAsset = Awaited<ReturnType<typeof listMediaAssets>>[number];

export async function listSettings() {
  return db
    .select({ key: siteSettings.key, value: siteSettings.value, updatedAt: siteSettings.updatedAt })
    .from(siteSettings)
    .orderBy(asc(siteSettings.key));
}
