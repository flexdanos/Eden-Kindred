"use client";

import Link from "next/link";
import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { MediaPicker, type PickableAsset } from "@/components/admin/media-picker";
import { saveRelease } from "@/app/admin/mutations";

type Track = {
  trackNumber: number;
  title: string;
  writtenBy: string | null;
  durationSeconds: number | null;
};

type Release = {
  id: string;
  title: string;
  slug: string;
  type: "album" | "ep" | "single" | "live_session";
  description: string | null;
  releasedAt: string | null;
  coverMediaId: string | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  bandcampUrl: string | null;
  youtubeVideoId: string | null;
  spotifyEmbedId: string | null;
  sortOrder: number;
  isPublished: boolean;
  tracks: Track[];
};

/** Turns stored tracks back into the one-per-line format the textarea uses. */
function tracksToText(tracks: Track[]): string {
  return tracks
    .map((t) => {
      const duration =
        t.durationSeconds != null
          ? `${Math.floor(t.durationSeconds / 60)}:${String(t.durationSeconds % 60).padStart(2, "0")}`
          : "";
      return [t.title, t.writtenBy ?? "", duration]
        .join(" | ")
        .replace(/(\s\|\s*)+$/, "");
    })
    .join("\n");
}

export function ReleaseEditor({
  release,
  assets,
}: {
  release: Release | null;
  assets: PickableAsset[];
}) {
  return (
    <SaveForm action={saveRelease} submitLabel={release ? "Save changes" : "Create release"}>
      {(state) => (
        <>
          {release && <input type="hidden" name="id" value={release.id} />}

          <Field label="Title" name="title" errors={state.fieldErrors?.title}>
            <input
              id="title"
              name="title"
              defaultValue={release?.title ?? ""}
              className={inputClass}
              required
            />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Type" name="type" errors={state.fieldErrors?.type}>
              <select
                id="type"
                name="type"
                defaultValue={release?.type ?? "single"}
                className={inputClass}
              >
                <option value="single">Single</option>
                <option value="ep">EP</option>
                <option value="album">Album</option>
                <option value="live_session">Live session</option>
              </select>
            </Field>

            <Field
              label="Released"
              name="releasedAt"
              errors={state.fieldErrors?.releasedAt}
            >
              <input
                id="releasedAt"
                name="releasedAt"
                type="date"
                defaultValue={release?.releasedAt ?? ""}
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Web address"
            name="slug"
            hint="Leave blank to build one from the title."
            errors={state.fieldErrors?.slug}
          >
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-sm text-muted-foreground">/music/</span>
              <input
                id="slug"
                name="slug"
                defaultValue={release?.slug ?? ""}
                className={inputClass}
                placeholder="auto"
              />
            </div>
          </Field>

          <Field
            label="About this release"
            name="description"
            hint="Where it was recorded, who played, what it is for."
            errors={state.fieldErrors?.description}
          >
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={release?.description ?? ""}
              className={inputClass}
            />
          </Field>

          <MediaPicker
            name="coverMediaId"
            assets={assets}
            defaultAssetId={release?.coverMediaId ?? null}
            label="Cover art"
          />

          <fieldset className="m-0 mb-5 p-0 border-0">
            <legend className="mb-3 p-0 text-sm font-medium">Listening links</legend>
            <div className="grid gap-x-4 sm:grid-cols-2">
              {(
                [
                  ["spotifyUrl", "Spotify"],
                  ["appleMusicUrl", "Apple Music"],
                  ["youtubeUrl", "YouTube"],
                  ["bandcampUrl", "Bandcamp"],
                ] as const
              ).map(([name, label]) => (
                <Field key={name} label={label} name={name} errors={state.fieldErrors?.[name]}>
                  <input
                    id={name}
                    name={name}
                    type="url"
                    defaultValue={release?.[name] ?? ""}
                    className={inputClass}
                    placeholder="https://"
                  />
                </Field>
              ))}
            </div>
          </fieldset>

          <fieldset className="m-0 mb-5 p-0 border-0">
            <legend className="mb-1 p-0 text-sm font-medium">Players</legend>
            <p className="m-0 mb-3 text-xs text-muted-foreground">
              Paste the <strong>id only</strong>, not the whole embed code. For YouTube it
              is the part after <code>v=</code>; for Spotify it is the last segment of the
              share link.
            </p>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field
                label="YouTube video id"
                name="youtubeVideoId"
                errors={state.fieldErrors?.youtubeVideoId}
              >
                <input
                  id="youtubeVideoId"
                  name="youtubeVideoId"
                  defaultValue={release?.youtubeVideoId ?? ""}
                  className={`${inputClass} font-mono`}
                  placeholder="dQw4w9WgXcQ"
                />
              </Field>
              <Field
                label="Spotify id"
                name="spotifyEmbedId"
                errors={state.fieldErrors?.spotifyEmbedId}
              >
                <input
                  id="spotifyEmbedId"
                  name="spotifyEmbedId"
                  defaultValue={release?.spotifyEmbedId ?? ""}
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </div>
          </fieldset>

          <Field
            label="Tracks"
            name="tracks"
            hint="One per line: Title | written by | 3:42. Only the title is required."
            errors={state.fieldErrors?.tracks}
          >
            <textarea
              id="tracks"
              name="tracks"
              rows={8}
              defaultValue={release ? tracksToText(release.tracks) : ""}
              className={`${inputClass} font-mono text-xs leading-relaxed`}
            />
          </Field>

          <Field
            label="Order"
            name="sortOrder"
            hint="Lower numbers appear first on the Music page."
            errors={state.fieldErrors?.sortOrder}
          >
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={release?.sortOrder ?? 0}
              className={`${inputClass} max-w-24`}
            />
          </Field>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={release?.isPublished ?? false}
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
      href="/admin/releases"
      className="text-sm text-muted-foreground no-underline hover:text-foreground"
    >
      ← All music
    </Link>
  );
}
