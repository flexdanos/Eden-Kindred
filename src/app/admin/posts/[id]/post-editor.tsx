"use client";

import Link from "next/link";
import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { MediaPicker, type PickableAsset } from "@/components/admin/media-picker";
import { savePost } from "@/app/admin/mutations";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverMediaId: string | null;
  isPublished: boolean;
};

export function PostEditor({
  post,
  assets,
}: {
  post: Post | null;
  assets: PickableAsset[];
}) {
  return (
    <SaveForm action={savePost} submitLabel={post ? "Save changes" : "Create post"}>
      {(state) => (
        <>
          {post && <input type="hidden" name="id" value={post.id} />}

          <Field label="Title" name="title" errors={state.fieldErrors?.title}>
            <input
              id="title"
              name="title"
              defaultValue={post?.title ?? ""}
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
              <span className="text-sm text-muted-foreground shrink-0">/teaching/</span>
              <input
                id="slug"
                name="slug"
                defaultValue={post?.slug ?? ""}
                className={inputClass}
                placeholder="auto"
              />
            </div>
          </Field>

          <Field
            label="Excerpt"
            name="excerpt"
            hint="One or two sentences. Shown in listings and on the home page."
            errors={state.fieldErrors?.excerpt}
          >
            <textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              defaultValue={post?.excerpt ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Body" name="body" errors={state.fieldErrors?.body}>
            <textarea
              id="body"
              name="body"
              rows={16}
              defaultValue={post?.body ?? ""}
              className={`${inputClass} font-mono text-xs leading-relaxed`}
              required
            />
          </Field>

          <MediaPicker
            name="coverMediaId"
            assets={assets}
            defaultAssetId={post?.coverMediaId ?? null}
            label="Cover image"
          />

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={post?.isPublished ?? false}
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
      href="/admin/posts"
      className="text-sm text-muted-foreground no-underline hover:text-foreground"
    >
      ← All teaching
    </Link>
  );
}
