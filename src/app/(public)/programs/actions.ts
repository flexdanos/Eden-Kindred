"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { programComments } from "@/lib/db/schema";
import { getPublishedProgramId } from "@/lib/db/queries/public";
import type { ActionState } from "@/app/admin/mutations";

/**
 * The one intentionally unauthenticated write in this app.
 *
 * Everything in admin/mutations.ts begins with requireStaff()/requireAdmin() —
 * that file's own header comment treats a missing guard there as a shipped
 * security hole. This action is different on purpose: anyone visiting a
 * program's page can leave a comment, no account needed. What keeps it from
 * being an open write to anything:
 *
 *   - the target program must exist and be published, so a comment can't land
 *     on a draft/unpublished row a visitor guessed the id for;
 *   - name and body are length-capped;
 *   - a honeypot field that a real visitor never sees or fills — if it's
 *     non-empty, the submit is silently accepted but nothing is written.
 *
 * There is no rate limiting or captcha here; this codebase has no existing
 * infrastructure for either, and adding one is out of scope unless asked.
 */
const commentSchema = z.object({
  eventId: z.string().uuid(),
  slug: z.string().trim().min(1).max(80),
  authorName: z.string().trim().min(1, "Tell us who you are").max(80),
  body: z.string().trim().min(1, "Say something").max(2000),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
});

export async function addProgramComment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { eventId, slug, authorName, body, website } = parsed.data;
  if (website) return { ok: true, message: "Thanks for your comment." };

  const programId = await getPublishedProgramId(eventId);
  if (!programId) {
    return { ok: false, message: "That program couldn't be found." };
  }

  try {
    await db.insert(programComments).values({ eventId: programId, authorName, body });
  } catch (error) {
    console.error("[public] addProgramComment", error);
    return { ok: false, message: "That didn't save. Try again." };
  }

  revalidatePath(`/programs/${slug}`);
  return { ok: true, message: "Thanks for your comment." };
}
