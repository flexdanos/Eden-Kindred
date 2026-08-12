"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { requireAdmin, requireStaff } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/app/admin/mutations";

const fail = (message: string): ActionState => ({ ok: false, message });

/**
 * The file bytes never pass through here.
 *
 * The browser uploads straight to Supabase Storage using the admin's own
 * session — that keeps a 8 MB photo off the serverless request path and out of
 * the body-size limit. This action only records the resulting object so the
 * rest of the app can join against it.
 *
 * Because the upload itself is authorised by the Storage policies in
 * supabase/storage.sql, a caller could in principle record a row for an object
 * they didn't upload. That is harmless (the row points at a real object in a
 * public bucket) and the guard below still keeps non-staff out entirely.
 */
const recordSchema = z.object({
  bucket: z.literal("media"),
  path: z.string().min(1).max(400),
  altText: z.string().trim().max(300).optional().or(z.literal("")),
  width: z.coerce.number().int().positive().max(20000).optional(),
  height: z.coerce.number().int().positive().max(20000).optional(),
});

export async function recordMediaAsset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return fail(auth.error);

  const parsed = recordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "That upload couldn't be recorded.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { bucket, path, altText, width, height } = parsed.data;

  try {
    await db.insert(mediaAssets).values({
      bucket,
      path,
      altText: altText || null,
      width: width ?? null,
      height: height ?? null,
      uploadedBy: auth.user.id,
    });
  } catch (error) {
    console.error("[media] recordMediaAsset", error);
    return fail("The file uploaded but recording it failed. Try uploading again.");
  }

  revalidatePath("/admin/media");
  return { ok: true, message: "Uploaded." };
}

const altSchema = z.object({
  id: z.string().uuid(),
  altText: z.string().trim().max(300),
});

export async function updateMediaAlt(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireStaff();
  if (!auth.ok) return fail(auth.error);

  const parsed = altSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Alt text can be at most 300 characters.");

  await db
    .update(mediaAssets)
    .set({ altText: parsed.data.altText || null })
    .where(eq(mediaAssets.id, parsed.data.id));

  revalidatePath("/admin/media");
  revalidatePath("/");
  return { ok: true, message: "Alt text saved." };
}

/**
 * Deletes the row and the object.
 *
 * Order matters: remove the Storage object FIRST. If the row went first and the
 * Storage call then failed, the object would be orphaned with nothing left
 * pointing at it — unreachable through the UI and invisible in any audit. A
 * failed Storage delete aborts before the row is touched, so the pair stays
 * consistent and the operation can simply be retried.
 *
 * Uses the service-role client because deletion is admin-only and shouldn't
 * depend on the caller's Storage policy evaluation.
 */
export async function deleteMediaAsset(formData: FormData): Promise<void> {
  const auth = await requireAdmin();
  if (!auth.ok) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [asset] = await db
    .select({ bucket: mediaAssets.bucket, path: mediaAssets.path })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);

  if (!asset) return;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(asset.bucket).remove([asset.path]);

  if (error) {
    console.error("[media] storage delete failed, keeping row", { id, error });
    return;
  }

  // Content rows reference media with onDelete: "set null", so anything using
  // this image falls back to the generated brand field rather than breaking.
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));

  revalidatePath("/admin/media");
  revalidatePath("/");
}
