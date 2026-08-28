"use client";

import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { addProgramComment } from "@/app/(public)/programs/actions";

export function ProgramCommentForm({ eventId, slug }: { eventId: string; slug: string }) {
  return (
    <SaveForm action={addProgramComment} submitLabel="Post comment">
      {(state) => (
        <>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="slug" value={slug} />
          {/* Honeypot: hidden from real visitors via CSS, not `hidden`/`type=hidden`, since some
              bots specifically skip those. Left empty, it does nothing. */}
          <div className="absolute -left-[9999px]" aria-hidden>
            <label>
              Leave this field empty
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <Field label="Name" name="authorName" errors={state.fieldErrors?.authorName}>
            <input
              id="authorName"
              name="authorName"
              className={inputClass}
              maxLength={80}
              required
            />
          </Field>

          <Field label="Comment" name="body" errors={state.fieldErrors?.body}>
            <textarea
              id="body"
              name="body"
              rows={4}
              className={inputClass}
              maxLength={2000}
              required
            />
          </Field>
        </>
      )}
    </SaveForm>
  );
}
