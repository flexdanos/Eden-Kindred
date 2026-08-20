"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  contentBlocks,
  donations,
  events,
  partnershipTiers,
  posts,
  releaseTracks,
  releases,
  siteSettings,
  teamResources,
} from "@/lib/db/schema";
import { requireStaff, requireAdmin } from "@/lib/auth/guard";
import { toMinor } from "@/lib/money";
import { CONTENT_BLOCK_DATA_FIELDS, CONTENT_BLOCK_KINDS } from "@/lib/content-block-kinds";

/**
 * Every mutation in this file begins with requireStaff() or requireAdmin().
 *
 * That is not belt-and-braces — it is the ONLY authorisation check that runs.
 * Drizzle connects as a privileged Postgres role, so the policies in
 * supabase/rls-policies.sql never evaluate on these queries. Middleware only
 * proves a session exists, and a Server Action can be invoked directly without
 * ever rendering the admin layout.
 *
 * If you add an action here without a guard, you have shipped an unauthenticated
 * write endpoint.
 */

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const ok = (message: string): ActionState => ({ ok: true, message });
const fail = (message: string): ActionState => ({ ok: false, message });

/** Media pickers post "" for "none"; the column wants null. */
const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((v) => (v ? v : null));

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// ── Content blocks ───────────────────────────────────────────────────────

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const blockSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  slug: z.string().trim().min(2).max(80),
  kind: z.enum(CONTENT_BLOCK_KINDS),
  sortOrder: z.string().optional().or(z.literal("")),
  title: optionalText(200),
  body: optionalText(20_000),
  mediaId: optionalUuid,
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
  // Kind-specific fields, folded into `data` below. Always present in the
  // form; which ones actually get saved depends on the selected `kind`.
  primaryLabel: optionalText(80),
  primaryHref: optionalText(300),
  secondaryLabel: optionalText(80),
  secondaryHref: optionalText(300),
  lead: optionalText(200),
  linkLabel: optionalText(80),
  linkHref: optionalText(300),
  secondaryTitle: optionalText(200),
  secondaryBody: optionalText(4000),
  emptyTitle: optionalText(200),
  emptyBody: optionalText(400),
  limit: optionalText(4),
});

export async function saveContentBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return fail(auth.error);

  const parsed = blockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const d = parsed.data;
  const published = d.isPublished === "on";

  const data: Record<string, unknown> = {};
  for (const field of CONTENT_BLOCK_DATA_FIELDS[d.kind]) {
    const value = d[field as keyof typeof d];
    if (typeof value === "string" && value.trim()) {
      data[field] = field === "limit" ? Number(value) : value.trim();
    }
  }

  const values = {
    slug: slugify(d.slug),
    kind: d.kind,
    sortOrder: Number(d.sortOrder || 0),
    title: d.title || null,
    body: d.body || null,
    data,
    mediaId: d.mediaId,
    isPublished: published,
    publishedAt: published ? new Date() : null,
    updatedBy: auth.user.id,
    updatedAt: new Date(),
  };

  try {
    if (d.id) {
      await db.update(contentBlocks).set(values).where(eq(contentBlocks.id, d.id));
    } else {
      await db.insert(contentBlocks).values(values);
    }
  } catch (error) {
    console.error("[admin] saveContentBlock", error);
    return fail("That slug is already in use, or the save failed. Try again.");
  }

  revalidatePath("/admin/content");
  revalidatePath("/");
  return ok(published ? "Saved and published." : "Saved as a draft.");
}

export async function deleteContentBlock(formData: FormData): Promise<void> {
  const auth = await requireAdmin();
  if (!auth.ok) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(contentBlocks).where(eq(contentBlocks.id, id));
  revalidatePath("/admin/content");
  revalidatePath("/");
}

// ── Posts ────────────────────────────────────────────────────────────────

const postSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Give it a title").max(200),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  excerpt: z.string().trim().max(400).optional().or(z.literal("")),
  body: z.string().min(1, "Write something").max(80_000),
  coverMediaId: optionalUuid,
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function savePost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return fail(auth.error);

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { id, title, slug, excerpt, body, coverMediaId, isPublished } = parsed.data;
  const published = isPublished === "on";

  const values = {
    title,
    slug: slugify(slug || title),
    excerpt: excerpt || null,
    body,
    coverMediaId,
    isPublished: published,
    publishedAt: published ? new Date() : null,
    authorId: auth.user.id,
  };

  try {
    if (id) await db.update(posts).set(values).where(eq(posts.id, id));
    else await db.insert(posts).values(values);
  } catch (error) {
    console.error("[admin] savePost", error);
    return fail("That slug is already taken, or the save failed.");
  }

  revalidatePath("/admin/posts");
  revalidatePath("/teaching");
  revalidatePath("/");
  return ok(published ? "Published." : "Saved as a draft.");
}

export async function deletePost(formData: FormData): Promise<void> {
  const auth = await requireAdmin();
  if (!auth.ok) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/admin/posts");
  revalidatePath("/teaching");
}

// ── Events ───────────────────────────────────────────────────────────────

const eventSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Give it a title").max(200),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  startsAt: z.string().min(1, "When does it start?"),
  endsAt: z.string().optional().or(z.literal("")),
  coverMediaId: optionalUuid,
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function saveEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return fail(auth.error);

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { id, title, slug, description, location, startsAt, endsAt, coverMediaId, isPublished } =
    parsed.data;

  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;

  if (Number.isNaN(start.getTime())) return fail("That start time isn't a valid date.");
  if (end && end < start) return fail("The end time is before the start time.");

  const values = {
    title,
    slug: slugify(slug || title),
    description: description || null,
    location: location || null,
    startsAt: start,
    endsAt: end,
    coverMediaId,
    isPublished: isPublished === "on",
  };

  try {
    if (id) await db.update(events).set(values).where(eq(events.id, id));
    else await db.insert(events).values(values);
  } catch (error) {
    console.error("[admin] saveEvent", error);
    return fail("That slug is already taken, or the save failed.");
  }

  revalidatePath("/admin/events");
  revalidatePath("/gatherings");
  revalidatePath("/");
  return ok(isPublished === "on" ? "Published." : "Saved as a draft.");
}

// ── Partnership tiers ────────────────────────────────────────────────────

const tierSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Name the tier").max(80),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  amount: z.string().min(1, "Set an amount"),
  cadence: z.enum(["monthly", "quarterly", "annual"]),
  sortOrder: z.string().optional().or(z.literal("")),
  isActive: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function saveTier(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error);

  const parsed = tierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { id, name, description, amount, cadence, sortOrder, isActive } = parsed.data;

  let amountMinor: number;
  try {
    amountMinor = toMinor(amount);
  } catch {
    return fail("That amount isn't a number.");
  }
  if (amountMinor < 100) return fail("Set a tier of at least ₵1.");

  const values = {
    name,
    description: description || null,
    amountMinor,
    cadence,
    sortOrder: Number(sortOrder || 0),
    isActive: isActive === "on",
  };

  try {
    if (id) await db.update(partnershipTiers).set(values).where(eq(partnershipTiers.id, id));
    else await db.insert(partnershipTiers).values(values);
  } catch (error) {
    console.error("[admin] saveTier", error);
    return fail("Saving the tier failed.");
  }

  revalidatePath("/admin/tiers");
  revalidatePath("/give");
  revalidatePath("/partnership");
  return ok("Saved.");
}

// ── Releases ─────────────────────────────────────────────────────────────

const releaseSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Name the release").max(200),
  slug: z.string().trim().max(80).optional().or(z.literal("")),
  type: z.enum(["album", "ep", "single", "live_session"]),
  description: z.string().max(8000).optional().or(z.literal("")),
  releasedAt: z.string().optional().or(z.literal("")),
  coverMediaId: optionalUuid,
  spotifyUrl: z.string().trim().url().optional().or(z.literal("")),
  appleMusicUrl: z.string().trim().url().optional().or(z.literal("")),
  youtubeUrl: z.string().trim().url().optional().or(z.literal("")),
  bandcampUrl: z.string().trim().url().optional().or(z.literal("")),
  // IDs, never embed markup — see src/components/release-player.tsx.
  youtubeVideoId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]*$/, "Just the video id, not the whole embed code")
    .max(64)
    .optional()
    .or(z.literal("")),
  spotifyEmbedId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]*$/, "Just the id from the Spotify share link")
    .max(64)
    .optional()
    .or(z.literal("")),
  sortOrder: z.string().optional().or(z.literal("")),
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
  /** One track per line: `Title | written by | 3:42`. Only the title is required. */
  tracks: z.string().max(20_000).optional().or(z.literal("")),
});

function parseTracks(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [title, writtenBy, duration] = line.split("|").map((p) => p.trim());
      let durationSeconds: number | null = null;

      if (duration && /^\d{1,2}:\d{2}$/.test(duration)) {
        const [m, s] = duration.split(":").map(Number);
        durationSeconds = m * 60 + s;
      }

      return {
        trackNumber: i + 1,
        title: title || `Track ${i + 1}`,
        writtenBy: writtenBy || null,
        durationSeconds,
      };
    });
}

export async function saveRelease(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return fail(auth.error);

  const parsed = releaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const d = parsed.data;
  const published = d.isPublished === "on";

  const values = {
    title: d.title,
    slug: slugify(d.slug || d.title),
    type: d.type,
    description: d.description || null,
    releasedAt: d.releasedAt || null,
    coverMediaId: d.coverMediaId,
    spotifyUrl: d.spotifyUrl || null,
    appleMusicUrl: d.appleMusicUrl || null,
    youtubeUrl: d.youtubeUrl || null,
    bandcampUrl: d.bandcampUrl || null,
    youtubeVideoId: d.youtubeVideoId || null,
    spotifyEmbedId: d.spotifyEmbedId || null,
    sortOrder: Number(d.sortOrder || 0),
    isPublished: published,
    publishedAt: published ? new Date() : null,
  };

  try {
    let releaseId = d.id || null;

    if (releaseId) {
      await db.update(releases).set(values).where(eq(releases.id, releaseId));
    } else {
      const [row] = await db.insert(releases).values(values).returning({ id: releases.id });
      releaseId = row.id;
    }

    // Tracks are replaced wholesale rather than diffed. They are a short
    // ordered list typed as text, and a diff would be more code and more ways
    // to end up with a duplicate track number.
    await db.delete(releaseTracks).where(eq(releaseTracks.releaseId, releaseId));

    const tracks = parseTracks(d.tracks ?? "");
    if (tracks.length > 0) {
      await db.insert(releaseTracks).values(tracks.map((t) => ({ ...t, releaseId })));
    }
  } catch (error) {
    console.error("[admin] saveRelease", error);
    return fail("That web address is already used by another release, or the save failed.");
  }

  revalidatePath("/admin/releases");
  revalidatePath("/music");
  return ok(published ? "Published." : "Saved as a draft.");
}

// ── Team resources ───────────────────────────────────────────────────────

const teamResourceSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Give it a title").max(200),
  kind: z.enum(["chord_chart", "rehearsal_audio", "setlist", "note"]),
  body: z.string().max(20_000).optional().or(z.literal("")),
  mediaId: optionalUuid,
  externalUrl: z.string().trim().url().optional().or(z.literal("")),
  eventId: optionalUuid,
});

export async function saveTeamResource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return fail(auth.error);

  const parsed = teamResourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const d = parsed.data;
  const values = {
    title: d.title,
    kind: d.kind,
    body: d.body || null,
    mediaId: d.mediaId,
    externalUrl: d.externalUrl || null,
    eventId: d.eventId,
    createdBy: auth.user.id,
    updatedAt: new Date(),
  };

  try {
    if (d.id) await db.update(teamResources).set(values).where(eq(teamResources.id, d.id));
    else await db.insert(teamResources).values(values);
  } catch (error) {
    console.error("[admin] saveTeamResource", error);
    return fail("Saving that failed.");
  }

  revalidatePath("/admin/team");
  revalidatePath("/team");
  return ok("Saved.");
}

export async function deleteTeamResource(formData: FormData): Promise<void> {
  const auth = await requireStaff();
  if (!auth.ok) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(teamResources).where(eq(teamResources.id, id));
  revalidatePath("/admin/team");
  revalidatePath("/team");
}

// ── Manual gifts ─────────────────────────────────────────────────────────

const manualGiftSchema = z.object({
  provider: z.enum(["bank_transfer", "zelle", "cash_app", "other"]),
  reference: z.string().trim().min(1, "Enter the reference from your statement").max(120),
  amount: z.string().min(1, "Enter the amount"),
  currency: z.string().trim().length(3).default("GHS"),
  donorName: z.string().trim().max(120).optional().or(z.literal("")),
  donorEmail: z.string().trim().email().optional().or(z.literal("")),
  paidAt: z.string().min(1, "When did it arrive?"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  isPublicDisplay: z.union([z.literal("on"), z.literal("")]).optional(),
});

/**
 * Records a gift that arrived outside Paystack — a bank transfer, Zelle, or
 * Cash App.
 *
 * None of those rails can notify a website: Zelle has no merchant API at all,
 * and the others need a merchant account this project does not have. So the
 * only way the dashboard tells the truth about total income is if someone
 * reads the statement and enters what they find.
 *
 * The gift is written straight to `succeeded` because, unlike a Paystack
 * charge, its existence has already been verified — by a human, looking at a
 * bank statement.
 */
export async function recordManualGift(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return fail(auth.error);

  const parsed = manualGiftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const d = parsed.data;

  let amountMinor: number;
  try {
    amountMinor = toMinor(d.amount);
  } catch {
    return fail("That amount isn't a number.");
  }
  if (amountMinor < 1) return fail("Enter an amount greater than zero.");

  const paidAt = new Date(d.paidAt);
  if (Number.isNaN(paidAt.getTime())) return fail("That date isn't valid.");

  try {
    await db.insert(donations).values({
      provider: d.provider,
      providerReference: d.reference,
      amountMinor,
      currency: d.currency.toUpperCase(),
      type: "one_time",
      status: "succeeded",
      donorName: d.donorName || null,
      donorEmail: d.donorEmail || null,
      isPublicDisplay: d.isPublicDisplay === "on",
      paidAt,
      note: d.note || null,
      recordedBy: auth.user.id,
    });
  } catch (error) {
    console.error("[admin] recordManualGift", error);
    // The unique index on (provider, provider_reference) is what makes this
    // safe to retry — the same bank reference cannot be entered twice.
    return fail("A gift with that reference is already recorded for this method.");
  }

  revalidatePath("/admin/donations");
  revalidatePath("/admin");
  return ok("Gift recorded.");
}

// ── Site settings ────────────────────────────────────────────────────────

export async function saveSetting(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireAdmin();
  if (!auth.ok) return fail(auth.error);

  const key = String(formData.get("key") ?? "").trim();
  const raw = String(formData.get("value") ?? "");

  if (!key) return fail("A setting needs a key.");

  // Stored as jsonb. Accept JSON when it parses, otherwise store the string —
  // an admin typing `Accra` shouldn't have to remember to quote it.
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw;
  }

  try {
    await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      });
  } catch (error) {
    console.error("[admin] saveSetting", error);
    return fail("Saving the setting failed.");
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return ok("Saved.");
}
