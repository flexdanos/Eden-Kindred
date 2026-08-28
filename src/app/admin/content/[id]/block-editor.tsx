"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, SaveForm, inputClass } from "@/components/admin/save-form";
import { MediaPicker, type PickableAsset } from "@/components/admin/media-picker";
import { saveContentBlock } from "@/app/admin/mutations";
import {
  CONTENT_BLOCK_DATA_FIELDS,
  CONTENT_BLOCK_KIND_INFO,
  CONTENT_BLOCK_KINDS,
  type ContentBlockKind,
} from "@/lib/content-block-kinds";

type Block = {
  id: string;
  slug: string;
  kind: ContentBlockKind;
  sortOrder: number;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  mediaId: string | null;
  isPublished: boolean;
};

const FIELD_META: Record<
  string,
  { label: string; hint?: string; multiline?: boolean; type?: string }
> = {
  primaryLabel: { label: "Primary button label" },
  primaryHref: { label: "Primary button link", hint: "A path like /join" },
  secondaryLabel: { label: "Secondary button label" },
  secondaryHref: { label: "Secondary button link", hint: "A path like /partnership" },
  lead: { label: "Lead line", hint: "A short line shown above the body text." },
  linkLabel: { label: "Link label" },
  linkHref: { label: "Link target", hint: "A path like /community" },
  secondaryTitle: { label: "Second panel / sub-card heading" },
  secondaryBody: { label: "Second panel / sub-card body", multiline: true },
  emptyTitle: { label: "Empty-state heading", hint: "Shown when no program is scheduled." },
  emptyBody: { label: "Empty-state body", multiline: true },
  limit: { label: "How many to show", type: "number" },
};

function dataValue(data: Record<string, unknown> | null | undefined, field: string): string {
  const v = data?.[field];
  return v === undefined || v === null ? "" : String(v);
}

export function BlockEditor({
  block,
  defaultSlug,
  assets,
}: {
  block: Block | null;
  defaultSlug?: string;
  assets: PickableAsset[];
}) {
  const [kind, setKind] = useState<ContentBlockKind>(block?.kind ?? "standalone");
  const activeFields = CONTENT_BLOCK_DATA_FIELDS[kind];

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

          <Field
            label="Kind"
            name="kind"
            hint={CONTENT_BLOCK_KIND_INFO[kind].description}
            errors={state.fieldErrors?.kind}
          >
            <select
              id="kind"
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ContentBlockKind)}
              className={inputClass}
            >
              {CONTENT_BLOCK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {CONTENT_BLOCK_KIND_INFO[k].label}
                </option>
              ))}
            </select>
          </Field>

          {kind !== "standalone" && (
            <Field
              label="Order"
              name="sortOrder"
              hint="Where this falls among the other homepage sections — lower numbers come first."
              errors={state.fieldErrors?.sortOrder}
            >
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                step={10}
                defaultValue={block?.sortOrder ?? 0}
                className={inputClass}
              />
            </Field>
          )}

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

          {activeFields.map((field) => {
            const meta = FIELD_META[field];
            if (!meta) return null;
            return (
              <Field
                key={field}
                label={meta.label}
                name={field}
                hint={meta.hint}
                errors={state.fieldErrors?.[field]}
              >
                {meta.multiline ? (
                  <textarea
                    id={field}
                    name={field}
                    rows={4}
                    defaultValue={dataValue(block?.data, field)}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={field}
                    name={field}
                    type={meta.type ?? "text"}
                    defaultValue={dataValue(block?.data, field)}
                    className={inputClass}
                  />
                )}
              </Field>
            );
          })}

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
