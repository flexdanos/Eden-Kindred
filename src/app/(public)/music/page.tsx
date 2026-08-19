import type { Metadata } from "next";
import Link from "next/link";
import { CmsImage } from "@/components/cms-image";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { RELEASE_TYPE_LABEL } from "@/components/release-player";
import { safe } from "@/lib/db/safe";
import { getPublishedReleases } from "@/lib/db/queries/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Music",
  description:
    "Albums, EPs, singles, and live sessions from the Eden Kindred worship community.",
};

const yearOf = (d: string | null) => (d ? d.slice(0, 4) : null);

export default async function MusicPage() {
  const releases = await safe("music-releases", () => getPublishedReleases(), []);

  return (
    <>
      <section className="section">
        <div className="shell">
          <h1 className="m-0 text-step-5 max-w-[14ch]">
            <SplitWords text="What we have been *singing*" />
          </h1>
          <Reveal from="below" delay={0.3}>
            <p className="measure mt-8 text-step-1 text-quiet">
              Recordings from the gatherings and from the room next door. Most of it was
              written to be sung by a crowd rather than performed at one.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell">
          {releases.length > 0 ? (
            <ul className="list-none m-0 p-0 grid gap-8 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {releases.map((release, i) => (
                <li key={release.slug}>
                  <Reveal from="below" delay={Math.min(i, 6) * 0.06}>
                    <Link
                      href={`/music/${release.slug}`}
                      className="group block no-underline"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-(--radius) bg-surface">
                        <CmsImage
                          media={release.media}
                          alt={release.media?.altText ?? `${release.title} cover art`}
                          seed={release.slug.length * 7}
                          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                          className="transition-transform duration-500 ease-(--ease-brand-expo) group-hover:scale-[1.03]"
                        />
                      </div>
                      <h2 className="m-0 mt-4 text-step-1 transition-colors group-hover:text-brand">
                        {release.title}
                      </h2>
                      <p className="m-0 mt-1 text-step--1 text-quiet">
                        {RELEASE_TYPE_LABEL[release.type] ?? "Release"}
                        {yearOf(release.releasedAt) && ` · ${yearOf(release.releasedAt)}`}
                      </p>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <p className="measure text-quiet">
              Nothing published here yet. Releases appear as they are added from the admin
              console, each with its own listening links.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
