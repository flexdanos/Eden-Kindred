"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff, ChevronUp, ChevronDown, X } from "lucide-react";
import { publicStorageUrl } from "@/lib/storage";
import { MediaUploader } from "./media-uploader";
import type { PickableAsset } from "./media-picker";

type GalleryItem = { mediaId: string; caption: string };

/**
 * Multi-image counterpart to MediaPicker: an ordered set of images with a
 * caption each, written as JSON into one hidden input so it drops into the
 * existing SaveForm/Server Action flow the same way MediaPicker does.
 *
 * Reordering is up/down buttons rather than drag-and-drop — this is a handful
 * of photos per program, not a media library, so the extra dependency isn't
 * worth it.
 */
export function GalleryPicker({
  name = "gallery",
  assets,
  defaultItems = [],
  label = "Photo gallery",
}: {
  name?: string;
  assets: PickableAsset[];
  defaultItems?: { mediaId: string; caption: string | null }[];
  label?: string;
}) {
  const [items, setItems] = useState<GalleryItem[]>(
    defaultItems.map((i) => ({ mediaId: i.mediaId, caption: i.caption ?? "" })),
  );
  const [open, setOpen] = useState(false);

  const assetById = new Map(assets.map((a) => [a.id, a]));

  const move = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const setCaption = (index: number, caption: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, caption } : item)));
  };

  const toggleAsset = (assetId: string) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.mediaId === assetId);
      if (exists) return prev.filter((i) => i.mediaId !== assetId);
      return [...prev, { mediaId: assetId, caption: "" }];
    });
  };

  return (
    <div className="mb-5">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      <div className="border border-border p-3">
        {items.length > 0 ? (
          <ul className="list-none m-0 mb-3 p-0 flex flex-col gap-2">
            {items.map((item, index) => {
              const asset = assetById.get(item.mediaId);
              return (
                <li key={item.mediaId} className="flex items-start gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden bg-muted">
                    {asset ? (
                      <Image
                        src={publicStorageUrl(asset.bucket, asset.path)}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff size={16} aria-hidden />
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => setCaption(index, e.target.value)}
                    placeholder="Caption (optional)"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none"
                  />
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="rounded-md border border-border p-1 transition-colors duration-150 hover:bg-accent disabled:opacity-40"
                    >
                      <ChevronUp size={13} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label="Move down"
                      className="rounded-md border border-border p-1 transition-colors duration-150 hover:bg-accent disabled:opacity-40"
                    >
                      <ChevronDown size={13} aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove image"
                    className="shrink-0 self-start rounded-md border border-border p-1.5 transition-colors duration-150 hover:bg-accent"
                  >
                    <X size={13} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="m-0 mb-3 text-sm text-muted-foreground">No images added yet.</p>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-accent"
        >
          {open ? "Close" : "Add images"}
        </button>

        {open && (
          <div className="mt-3 border-t border-border pt-3">
            {assets.length > 0 ? (
              <ul className="list-none m-0 p-0 grid max-h-64 gap-2 overflow-y-auto [grid-template-columns:repeat(auto-fill,minmax(84px,1fr))]">
                {assets.map((asset) => {
                  const isSelected = items.some((i) => i.mediaId === asset.id);
                  return (
                    <li key={asset.id}>
                      <button
                        type="button"
                        onClick={() => toggleAsset(asset.id)}
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
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                            ✓
                          </span>
                        )}
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
