"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, Trash2 } from "lucide-react";
import { publicStorageUrl } from "@/lib/storage";
import { deleteMediaAsset, updateMediaAlt } from "./actions";
import type { ActionState } from "@/app/admin/mutations";

type Asset = {
  id: string;
  bucket: string;
  path: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
};

const initial: ActionState = { ok: false };

function AltForm({ asset }: { asset: Asset }) {
  const [state, action] = useActionState(updateMediaAlt, initial);

  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="id" value={asset.id} />
      <label htmlFor={`alt-${asset.id}`} className="sr-only">
        Alt text for this image
      </label>
      <div className="flex items-start gap-1.5">
        <input
          id={`alt-${asset.id}`}
          name="altText"
          defaultValue={asset.altText ?? ""}
          placeholder="Describe the scene"
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs transition-colors duration-150 focus:border-ring focus:outline-none"
        />
        <AltSave saved={state.ok} />
      </div>
      {/* Alt text is voice, not compliance boilerplate: "hands on a worn drum
          skin at dusk" beats "image of people". */}
      {!asset.altText && !state.ok && (
        <p className="m-0 mt-1 text-[0.6875rem] text-muted-foreground">
          No description yet — screen readers will skip this image.
        </p>
      )}
    </form>
  );
}

function AltSave({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Save description"
      className="shrink-0 rounded-md border border-border px-2 py-1 text-xs transition-colors duration-150 hover:bg-accent disabled:opacity-60"
    >
      {pending ? (
        <Loader2 size={12} className="animate-spin" aria-hidden />
      ) : saved ? (
        <Check size={12} aria-hidden />
      ) : (
        "Save"
      )}
    </button>
  );
}

function DeleteButton() {
  const [confirming, setConfirming] = useState(false);
  const { pending } = useFormStatus();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Delete this image"
        className="rounded-md p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-primary"
      >
        <Trash2 size={14} aria-hidden />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md border border-border px-2 py-1"
      >
        Keep
      </button>
    </span>
  );
}

export function MediaGrid({ assets }: { assets: Asset[] }) {
  return (
    <ul className="list-none m-0 p-0 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
      {assets.map((asset) => (
        <li key={asset.id} className="border border-border p-3">
          <div className="relative aspect-4/3 overflow-hidden bg-muted">
            <Image
              src={publicStorageUrl(asset.bucket, asset.path)}
              alt={asset.altText ?? ""}
              fill
              sizes="240px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="mt-2 flex items-start justify-between gap-2">
            <p className="m-0 text-[0.6875rem] text-muted-foreground tabular-nums">
              {asset.width && asset.height ? `${asset.width}×${asset.height}` : "size unknown"}
            </p>
            <form action={deleteMediaAsset}>
              <input type="hidden" name="id" value={asset.id} />
              <DeleteButton />
            </form>
          </div>

          <AltForm asset={asset} />
        </li>
      ))}
    </ul>
  );
}
