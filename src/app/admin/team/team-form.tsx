"use client";

import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { MediaPicker, type PickableAsset } from "@/components/admin/media-picker";
import { saveTeamResource } from "@/app/admin/mutations";

export function TeamResourceForm({
  assets,
  events,
}: {
  assets: PickableAsset[];
  events: { id: string; title: string }[];
}) {
  return (
    <SaveForm action={saveTeamResource} submitLabel="Add resource">
      {(state) => (
        <>
          <Field label="Title" name="title" errors={state.fieldErrors?.title}>
            <input
              id="title"
              name="title"
              className={inputClass}
              placeholder="Sunday setlist, or a chart title"
              required
            />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Kind" name="kind" errors={state.fieldErrors?.kind}>
              <select id="kind" name="kind" defaultValue="setlist" className={inputClass}>
                <option value="setlist">Setlist</option>
                <option value="chord_chart">Chord chart</option>
                <option value="rehearsal_audio">Rehearsal audio</option>
                <option value="note">Note</option>
              </select>
            </Field>

            <Field
              label="For which program"
              name="eventId"
              hint="Optional. Scoping it here files it under 'coming up'."
              errors={state.fieldErrors?.eventId}
            >
              <select id="eventId" name="eventId" defaultValue="" className={inputClass}>
                <option value="">Not specific to one</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Notes"
            name="body"
            hint="Keys, arrangement changes, who is leading what."
            errors={state.fieldErrors?.body}
          >
            <textarea id="body" name="body" rows={5} className={inputClass} />
          </Field>

          <MediaPicker
            name="mediaId"
            assets={assets}
            label="Attached file"
          />

          <Field
            label="External link"
            name="externalUrl"
            hint="A shared drive folder, a YouTube reference, a chart on another site."
            errors={state.fieldErrors?.externalUrl}
          >
            <input
              id="externalUrl"
              name="externalUrl"
              type="url"
              className={inputClass}
              placeholder="https://"
            />
          </Field>
        </>
      )}
    </SaveForm>
  );
}
