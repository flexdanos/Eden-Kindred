"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff, X } from "lucide-react";
import { publicStorageUrl } from "@/lib/storage";
import { MediaUploader } from "./media-uploader";

export type PickableAsset = {
  id: string;
  bucket: string;
  path: string;
  altText: string | null;
};

/**
 * Choose an image for a piece of content.
 *
 * Writes to a hidden input rather than owning form state, so it drops into the
 * existing SaveForm/Server Action flow without any of the editors needing to
 * know it exists.
 *
 * Not a modal: the picker expands inline. A modal here would trap the admin in
 * a second context just to answer "which picture", and the product register
 * rule is to exhaust inline alternatives first.
 */
export function MediaPicker({
  name = "mediaId",
  assets,
  defaultAssetId,
  label = "Image",
}: {
  name?: string;
  assets: PickableAsset[];
  defaultAssetId?: string | null;
  label?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(defaultAssetId ?? null);
  const [open, setOpen] = useState(false);

  const selected = assets.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="mb-5">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={selectedId ?? ""} />

      <div className="border border-border p-3">
        {selected ? (
          <div className="flex items-start gap-3">
            <div className="relative size-20 shrink-0 overflow-hidden bg-muted">
              <Image
                src={publicStorageUrl(selected.bucket, selected.path)}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm">
                {selected.altText || (
                  <span className="text-muted-foreground">No description set</span>
                )}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-accent"
                >
                  {open ? "Close" : "Change"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-accent"
                >
                  <X size={11} aria-hidden />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex size-20 shrink-0 items-center justify-center bg-muted text-muted-foreground">
              <ImageOff size={18} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm text-muted-foreground">
                None set — the site will render its generated brand field here.
              </p>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-2 rounded-md border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-accent"
              >
                {open ? "Close" : "Choose an image"}
              </button>
            </div>
          </div>
        )}

        {open && (
          <div className="mt-3 border-t border-border pt-3">
            {assets.length > 0 ? (
              <ul className="list-none m-0 p-0 grid max-h-64 gap-2 overflow-y-auto [grid-template-columns:repeat(auto-fill,minmax(84px,1fr))]">
                {assets.map((asset) => {
                  const isSelected = asset.id === selectedId;
                  return (
                    <li key={asset.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(asset.id);
                          setOpen(false);
                        }}
                        aria-pressed={isSelected}
                        title={asset.altText ?? "Untitled image"}
                        className="relative block aspect-square w-full overflow-hidden border-2 bg-muted transition-colors duration-150 data-[on=true]:border-primary border-transparent hover:border-border"
                        data-on={isSelected}
                      >
                        <Image
                          src={publicStorageUrl(asset.bucket, asset.path)}
                          alt={asset.altText ?? ""}
                          fill
                          sizes="84px"
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 mb-3 text-xs text-muted-foreground">
                Nothing in the library yet. Upload something below.
              </p>
            )}

            <div className="mt-3">
              <MediaUploader compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
