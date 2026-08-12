"use client";

import Link from "next/link";
import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { MediaPicker, type PickableAsset } from "@/components/admin/media-picker";
import { saveContentBlock } from "@/app/admin/mutations";

type Block = {
  id: string;
  slug: string;
  title: string | null;
  body: string | null;
  mediaId: string | null;
  isPublished: boolean;
};

export function BlockEditor({
  block,
  defaultSlug,
  assets,
}: {
  block: Block | null;
  defaultSlug?: string;
  assets: PickableAsset[];
}) {
  return (
    <SaveForm action={saveContentBlock} submitLabel={block ? "Save changes" : "Create section"}>
      {(state) => (
        <>
          {block && <input type="hidden" name="id" value={block.id} />}

          <Field
            label="Slug"
            name="slug"
            hint="The name the page looks up. Changing it on an existing section will orphan it."
            errors={state.fieldErrors?.slug}
          >
            <input
              id="slug"
              name="slug"
              defaultValue={block?.slug ?? defaultSlug ?? ""}
              className={`${inputClass} font-mono`}
              required
              readOnly={Boolean(block)}
            />
          </Field>

          <Field label="Heading" name="title" errors={state.fieldErrors?.title}>
            <input
              id="title"
              name="title"
              defaultValue={block?.title ?? ""}
              className={inputClass}
            />
          </Field>

          <Field
            label="Body"
            name="body"
            hint="Plain text. Kept short on purpose — these are section headings and standfirsts, not articles."
            errors={state.fieldErrors?.body}
          >
            <textarea
              id="body"
              name="body"
              rows={6}
              defaultValue={block?.body ?? ""}
              className={inputClass}
            />
          </Field>

          <MediaPicker
            assets={assets}
            defaultAssetId={block?.mediaId ?? null}
            label="Section image"
          />

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={block?.isPublished ?? false}
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
      href="/admin/content"
      className="text-sm text-muted-foreground no-underline hover:text-foreground"
    >
      ← All sections
    </Link>
  );
}
