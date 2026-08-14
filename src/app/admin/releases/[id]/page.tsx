import { notFound } from "next/navigation";
import { assertStaff } from "@/lib/auth/guard";
import { getReleaseById, listMediaAssets } from "@/lib/db/queries/admin-lists";
import { safe } from "@/lib/db/safe";
import { BackLink, ReleaseEditor } from "./release-editor";

export const dynamic = "force-dynamic";

export default async function ReleaseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertStaff();
  const { id } = await params;

  const isNew = id === "new";
  const [release, assets] = await Promise.all([
    isNew ? null : safe("admin-release", () => getReleaseById(id), null),
    safe("admin-media", () => listMediaAssets(), []),
  ]);

  if (!isNew && !release) notFound();

  return (
    <div className="max-w-5xl">
      <BackLink />
      <h1 className="m-0 mt-3 mb-6 text-2xl font-semibold tracking-tight">
        {isNew ? "New release" : release!.title}
      </h1>
      <ReleaseEditor
        release={
          release
            ? {
                id: release.id,
                title: release.title,
                slug: release.slug,
                type: release.type,
                description: release.description,
                releasedAt: release.releasedAt,
                coverMediaId: release.coverMediaId,
                spotifyUrl: release.spotifyUrl,
                appleMusicUrl: release.appleMusicUrl,
                youtubeUrl: release.youtubeUrl,
                bandcampUrl: release.bandcampUrl,
                youtubeVideoId: release.youtubeVideoId,
                spotifyEmbedId: release.spotifyEmbedId,
                sortOrder: release.sortOrder,
                isPublished: release.isPublished,
                tracks: release.tracks,
              }
            : null
        }
        assets={assets}
      />
    </div>
  );
}
