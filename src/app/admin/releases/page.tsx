import Link from "next/link";
import { Plus } from "lucide-react";
import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listReleases } from "@/lib/db/queries/admin-lists";
import { RELEASE_TYPE_LABEL } from "@/components/release-player";
import { PublishPill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  await assertStaff();
  const releases = await safe("admin-releases", () => listReleases(), []);

  return (
    <div className="max-w-5xl 2xl:max-w-6xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">Music</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            Albums, EPs, singles, and live sessions. Streaming links rather than hosted
            audio — the platforms handle the players and the bandwidth.
          </p>
        </div>
        <Link
          href="/admin/releases/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors duration-150 hover:bg-[var(--brand-hover)]"
        >
          <Plus size={15} aria-hidden />
          New release
        </Link>
      </header>

      {releases.length === 0 ? (
        <EmptyState
          title="No releases yet"
          body="Add a release with its Spotify, Apple Music, or YouTube links and it appears on the public Music page with a player."
          action={{ href: "/admin/releases/new", label: "Add the first one" }}
        />
      ) : (
        <ul className="list-none m-0 p-0 border border-border">
          {releases.map((release) => (
            <li key={release.id} className="border-b border-border last:border-0">
              <Link
                href={`/admin/releases/${release.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 no-underline transition-colors duration-150 hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{release.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {RELEASE_TYPE_LABEL[release.type] ?? release.type}
                    {release.releasedAt && ` · ${release.releasedAt}`}
                  </span>
                </span>
                <PublishPill published={release.isPublished} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
