"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  contentBlocks,
  events,
  partnershipTiers,
  posts,
  siteSettings,
} from "@/lib/db/schema";
import { requireStaff, requireAdmin } from "@/lib/auth/guard";
import { toMinor } from "@/lib/money";

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

const blockSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  slug: z.string().trim().min(2).max(80),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().max(20_000).optional().or(z.literal("")),
  mediaId: optionalUuid,
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
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

  const { id, slug, title, body, mediaId, isPublished } = parsed.data;
  const published = isPublished === "on";

  const values = {
    slug: slugify(slug),
    title: title || null,
    body: body || null,
    mediaId,
    isPublished: published,
    publishedAt: published ? new Date() : null,
    updatedBy: auth.user.id,
    updatedAt: new Date(),
  };

  try {
    if (id) {
      await db.update(contentBlocks).set(values).where(eq(contentBlocks.id, id));
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
