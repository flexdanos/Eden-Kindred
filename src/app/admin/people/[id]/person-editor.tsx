"use client";

import Link from "next/link";
import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { MediaPicker, type PickableAsset } from "@/components/admin/media-picker";
import { savePerson } from "@/app/admin/mutations";

type Person = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photoMediaId: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export function PersonEditor({
  person,
  assets,
}: {
  person: Person | null;
  assets: PickableAsset[];
}) {
  return (
    <SaveForm action={savePerson} submitLabel={person ? "Save changes" : "Add person"}>
      {(state) => (
        <>
          {person && <input type="hidden" name="id" value={person.id} />}

          <Field label="Name" name="name" errors={state.fieldErrors?.name}>
            <input
              id="name"
              name="name"
              defaultValue={person?.name ?? ""}
              className={inputClass}
              required
            />
          </Field>

          <Field
            label="What they do here"
            name="role"
            hint="A few words: “Leads worship”, “Hosts a kinship group in Osu”."
            errors={state.fieldErrors?.role}
          >
            <input
              id="role"
              name="role"
              defaultValue={person?.role ?? ""}
              className={inputClass}
            />
          </Field>

          <Field
            label="A line or two about them"
            name="bio"
            hint="Written so a newcomer knows who to look for. Nothing they would not say about themselves."
            errors={state.fieldErrors?.bio}
          >
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={person?.bio ?? ""}
              className={inputClass}
            />
          </Field>

          <MediaPicker
            name="photoMediaId"
            assets={assets}
            defaultAssetId={person?.photoMediaId ?? null}
            label="Photo"
          />

          <Field
            label="Order"
            name="sortOrder"
            hint="Lower numbers appear first on the People page."
            errors={state.fieldErrors?.sortOrder}
          >
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={person?.sortOrder ?? 0}
              className={`${inputClass} max-w-24`}
            />
          </Field>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={person?.isPublished ?? false}
              className="size-4 accent-[var(--brand)]"
            />
            Show on the public site — they have agreed to appear
          </label>
        </>
      )}
    </SaveForm>
  );
}

export function BackLink() {
  return (
    <Link
      href="/admin/people"
      className="text-sm text-muted-foreground no-underline hover:text-foreground"
    >
      ← All people
    </Link>
  );
}
