import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listMediaAssets } from "@/lib/db/queries/admin-lists";
import { MediaUploader } from "@/components/admin/media-uploader";
import { EmptyState } from "@/components/admin/empty-state";
import { MediaGrid } from "./media-grid";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await assertStaff();
  const assets = await safe("admin-media", () => listMediaAssets(), []);
  const missingAlt = assets.filter((a) => !a.altText).length;

  return (
    <div className="max-w-6xl 2xl:max-w-none">
      {/* Uncapped: the grid is auto-fill, so extra width becomes more
          thumbnails per row rather than bigger ones. */}
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">Media</h1>
        <p className="m-0 mt-1 text-sm text-muted-foreground">
          Photography for the public site. Wherever an image isn&apos;t set, the site
          renders a generated brand field instead — so nothing looks broken while you
          gather real pictures.
        </p>
      </header>

      <MediaUploader />

      {missingAlt > 0 && (
        <p className="mt-4 m-0 text-sm text-muted-foreground">
          {missingAlt} {missingAlt === 1 ? "image has" : "images have"} no description yet.
        </p>
      )}

      <div className="mt-6">
        {assets.length === 0 ? (
          <EmptyState
            title="Nothing uploaded yet"
            body="Upload the real photographs of your gatherings. Images go straight from this browser to Supabase Storage — they never pass through the app server, so large files upload at full speed."
          />
        ) : (
          <MediaGrid assets={assets} />
        )}
      </div>
    </div>
  );
}
