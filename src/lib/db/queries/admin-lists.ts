import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contentBlocks,
  events,
  mediaAssets,
  partnershipTiers,
  posts,
  programComments,
  programGallery,
  releaseTracks,
  releases,
  siteSettings,
  teamResources,
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
      kind: contentBlocks.kind,
      sortOrder: contentBlocks.sortOrder,
      title: contentBlocks.title,
      body: contentBlocks.body,
      isPublished: contentBlocks.isPublished,
      updatedAt: contentBlocks.updatedAt,
    })
    .from(contentBlocks)
    .orderBy(asc(contentBlocks.sortOrder), asc(contentBlocks.slug));
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

export async function listPrograms() {
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

export async function getProgramById(id: string) {
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!row) return null;

  const gallery = await db
    .select({
      id: programGallery.id,
      mediaId: programGallery.mediaId,
      caption: programGallery.caption,
      sortOrder: programGallery.sortOrder,
    })
    .from(programGallery)
    .where(eq(programGallery.eventId, id))
    .orderBy(asc(programGallery.sortOrder));

  return { ...row, gallery };
}

/** Comments for the admin edit page — newest first, so recent activity surfaces immediately. */
export async function listProgramComments(eventId: string) {
  return db
    .select({
      id: programComments.id,
      authorName: programComments.authorName,
      body: programComments.body,
      createdAt: programComments.createdAt,
    })
    .from(programComments)
    .where(eq(programComments.eventId, eventId))
    .orderBy(desc(programComments.createdAt));
}

export async function listTiers() {
  return db
    .select()
    .from(partnershipTiers)
    .orderBy(asc(partnershipTiers.sortOrder), asc(partnershipTiers.name));
}

export async function listReleases() {
  return db
    .select({
      id: releases.id,
      slug: releases.slug,
      title: releases.title,
      type: releases.type,
      releasedAt: releases.releasedAt,
      isPublished: releases.isPublished,
      sortOrder: releases.sortOrder,
    })
    .from(releases)
    .orderBy(asc(releases.sortOrder), desc(releases.releasedAt));
}

export async function getReleaseById(id: string) {
  const [row] = await db.select().from(releases).where(eq(releases.id, id)).limit(1);
  if (!row) return null;

  const tracks = await db
    .select()
    .from(releaseTracks)
    .where(eq(releaseTracks.releaseId, id))
    .orderBy(asc(releaseTracks.trackNumber));

  return { ...row, tracks };
}

export async function listTeamResources() {
  return db
    .select({
      id: teamResources.id,
      title: teamResources.title,
      kind: teamResources.kind,
      body: teamResources.body,
      externalUrl: teamResources.externalUrl,
      eventId: teamResources.eventId,
      eventTitle: events.title,
      eventStartsAt: events.startsAt,
      mediaPath: mediaAssets.path,
      mediaBucket: mediaAssets.bucket,
      createdAt: teamResources.createdAt,
    })
    .from(teamResources)
    .leftJoin(events, eq(teamResources.eventId, events.id))
    .leftJoin(mediaAssets, eq(teamResources.mediaId, mediaAssets.id))
    .orderBy(desc(teamResources.createdAt));
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
