"use client";

import Link from "next/link";
import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { MediaPicker, type PickableAsset } from "@/components/admin/media-picker";
import { saveEvent } from "@/app/admin/mutations";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  coverMediaId: string | null;
  isPublished: boolean;
};

/** datetime-local wants `YYYY-MM-DDTHH:mm` in LOCAL time, with no zone suffix. */
function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function EventEditor({
  event,
  assets,
}: {
  event: EventRow | null;
  assets: PickableAsset[];
}) {
  return (
    <SaveForm action={saveEvent} submitLabel={event ? "Save changes" : "Create gathering"}>
      {(state) => (
        <>
          {event && <input type="hidden" name="id" value={event.id} />}

          <Field label="Title" name="title" errors={state.fieldErrors?.title}>
            <input
              id="title"
              name="title"
              defaultValue={event?.title ?? ""}
              className={inputClass}
              required
            />
          </Field>

          <Field
            label="Web address"
            name="slug"
            hint="Leave blank to build one from the title."
            errors={state.fieldErrors?.slug}
          >
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-sm text-muted-foreground">/gatherings/</span>
              <input
                id="slug"
                name="slug"
                defaultValue={event?.slug ?? ""}
                className={inputClass}
                placeholder="auto"
              />
            </div>
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Starts" name="startsAt" errors={state.fieldErrors?.startsAt}>
              <input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={toLocalInput(event?.startsAt ?? null)}
                className={inputClass}
                required
              />
            </Field>

            <Field
              label="Ends"
              name="endsAt"
              hint="Optional."
              errors={state.fieldErrors?.endsAt}
            >
              <input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={toLocalInput(event?.endsAt ?? null)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Location" name="location" errors={state.fieldErrors?.location}>
            <input
              id="location"
              name="location"
              defaultValue={event?.location ?? ""}
              className={inputClass}
              placeholder="Where people should actually go"
            />
          </Field>

          <Field
            label="Description"
            name="description"
            hint="What to expect. Specific beats warm — name the room, the time, what happens."
            errors={state.fieldErrors?.description}
          >
            <textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={event?.description ?? ""}
              className={inputClass}
            />
          </Field>

          <MediaPicker
            name="coverMediaId"
            assets={assets}
            defaultAssetId={event?.coverMediaId ?? null}
            label="Cover image"
          />

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={event?.isPublished ?? false}
              className="size-4 accent-[var(--brand)]"
            />
            Publish to the public site
          </label>
        </>
      )}
    </SaveForm>
  );
}

export function BackLink() {
  return (
    <Link
      href="/admin/events"
      className="text-sm text-muted-foreground no-underline hover:text-foreground"
    >
      ← All gatherings
    </Link>
  );
}
