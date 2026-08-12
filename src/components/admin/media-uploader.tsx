"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { recordMediaAsset } from "@/app/admin/media/actions";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // must match the bucket's file_size_limit

type Upload = {
  name: string;
  status: "reading" | "uploading" | "recording" | "done" | "error";
  error?: string;
};

/** Filesystem-safe, collision-proof object key. */
function objectPath(fileName: string): string {
  const clean = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return `${crypto.randomUUID()}/${clean}`;
}

/**
 * Intrinsic dimensions, read before upload.
 *
 * Worth the extra decode: without width/height, next/image can't reserve space
 * and every image on the public site shifts layout as it loads — which on a
 * slow mobile connection is the most visible jank there is.
 */
async function readDimensions(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return {}; // GIFs and odd encodings can fail here; not worth blocking on.
  }
}

export function MediaUploader({
  onUploaded,
  compact = false,
}: {
  onUploaded?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      setBusy(true);
      const list = Array.from(files);
      setUploads(list.map((f) => ({ name: f.name, status: "reading" as const })));

      const supabase = createClient();

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const update = (patch: Partial<Upload>) =>
          setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));

        if (!ACCEPTED.includes(file.type)) {
          update({ status: "error", error: "Not an image we accept (JPEG, PNG, WebP, AVIF, GIF)." });
          continue;
        }
        if (file.size > MAX_BYTES) {
          update({
            status: "error",
            error: `${(file.size / 1024 / 1024).toFixed(1)} MB is over the 8 MB limit.`,
          });
          continue;
        }

        const dims = await readDimensions(file);
        const path = objectPath(file.name);

        update({ status: "uploading" });
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(path, file, { cacheControl: "31536000", upsert: false });

        if (uploadError) {
          update({ status: "error", error: uploadError.message });
          continue;
        }

        update({ status: "recording" });
        const form = new FormData();
        form.set("bucket", "media");
        form.set("path", path);
        if (dims.width) form.set("width", String(dims.width));
        if (dims.height) form.set("height", String(dims.height));

        const result = await recordMediaAsset({ ok: false }, form);

        if (!result.ok) {
          update({ status: "error", error: result.message ?? "Recording failed." });
          continue;
        }
        update({ status: "done" });
      }

      setBusy(false);
      router.refresh();
      onUploaded?.();
      if (inputRef.current) inputRef.current.value = "";
    },
    [onUploaded, router],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        data-dragging={dragging}
        className={`flex flex-col items-center justify-center border border-dashed border-border text-center transition-colors duration-150 data-[dragging=true]:border-primary data-[dragging=true]:bg-muted/60 ${
          compact ? "px-4 py-6" : "px-6 py-10"
        }`}
      >
        <ImagePlus size={compact ? 20 : 26} aria-hidden className="text-muted-foreground" />
        <p className="m-0 mt-3 text-sm">
          Drop images here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="underline underline-offset-2 disabled:opacity-60"
          >
            choose files
          </button>
        </p>
        <p className="m-0 mt-1 text-xs text-muted-foreground">
          JPEG, PNG, WebP, AVIF or GIF. Up to 8 MB each.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="list-none m-0 mt-3 p-0 flex flex-col gap-1.5" aria-live="polite">
          {uploads.map((u, i) => (
            <li key={`${u.name}-${i}`} className="flex items-start gap-2 text-xs">
              {u.status === "error" ? (
                <TriangleAlert size={13} aria-hidden className="mt-0.5 shrink-0 text-primary" />
              ) : u.status === "done" ? (
                <span aria-hidden className="mt-0.5 shrink-0 text-muted-foreground">
                  ✓
                </span>
              ) : (
                <Loader2 size={13} aria-hidden className="mt-0.5 shrink-0 animate-spin" />
              )}
              <span className="min-w-0">
                <span className="block truncate">{u.name}</span>
                {u.error && <span className="block text-primary">{u.error}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
