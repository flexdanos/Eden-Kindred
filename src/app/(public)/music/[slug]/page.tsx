import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import {
  RELEASE_TYPE_LABEL,
  SpotifyEmbed,
  YouTubeEmbed,
  formatDuration,
} from "@/components/release-player";
import { safe } from "@/lib/db/safe";
import { getReleaseBySlug } from "@/lib/db/queries/public";

export const revalidate = 300;

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const release = await safe("release-meta", () => getReleaseBySlug(slug), null);

  if (!release) return { title: "Release not found" };

  return {
    title: release.title,
    description: release.description?.slice(0, 160) ?? undefined,
    openGraph: { type: "music.album", title: release.title },
  };
}

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const release = await safe("release", () => getReleaseBySlug(slug), null);

  if (!release) notFound();

  const links = [
    { href: release.spotifyUrl, label: "Spotify" },
    { href: release.appleMusicUrl, label: "Apple Music" },
    { href: release.youtubeUrl, label: "YouTube" },
    { href: release.bandcampUrl, label: "Bandcamp" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  return (
    <article>
      <section className="section">
        <div className="shell">
          <Link
            href="/music"
            className="inline-flex items-center gap-2 text-step--1 text-quiet no-underline hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} aria-hidden />
            All music
          </Link>

          <div className="mt-8 grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:items-start">
            <Reveal from="left">
              <div className="relative aspect-square overflow-hidden rounded-(--radius) bg-surface">
                <CmsImage
                  media={release.media}
                  alt={release.media?.altText ?? `${release.title} cover art`}
                  seed={release.slug.length * 7}
                  sizes="(min-width: 768px) 40vw, 100vw"
                  priority
                />
              </div>
            </Reveal>

            <div>
              <p className="m-0 text-step--1 uppercase tracking-wider text-quiet">
                {RELEASE_TYPE_LABEL[release.type] ?? "Release"}
                {release.releasedAt &&
                  ` · ${dateFmt.format(new Date(release.releasedAt))}`}
              </p>

              <h1 className="m-0 mt-3 text-step-4 max-w-[18ch]">
                <SplitWords text={release.title} />
              </h1>

              {release.description && (
                <Reveal from="below" delay={0.3}>
                  <Prose text={release.description} className="mt-6 text-quiet" />
                </Reveal>
              )}

              {links.length > 0 && (
                <Reveal from="below" delay={0.38}>
                  <ul className="mt-8 flex flex-wrap gap-2 list-none m-0 p-0">
                    {links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 border border-hairline px-4 py-2.5 text-step--1 no-underline transition-colors hover:border-ink"
                        >
                          {link.label}
                          <ExternalLink size={13} aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      {(release.spotifyEmbedId || release.youtubeVideoId) && (
        <section className="section border-t border-hairline">
          <div className="shell grid gap-8 lg:grid-cols-2">
            {release.spotifyEmbedId && (
              <SpotifyEmbed
                embedId={release.spotifyEmbedId}
                kind={release.type === "single" ? "track" : "album"}
                title={release.title}
              />
            )}
            {release.youtubeVideoId && (
              <YouTubeEmbed videoId={release.youtubeVideoId} title={release.title} />
            )}
          </div>
        </section>
      )}

      {release.tracks.length > 0 && (
        <section className="section bg-surface border-t border-hairline">
          <div className="shell">
            <h2 className="m-0 text-step-3">
              <SplitWords text="*Tracks*" />
            </h2>
            <ol className="mt-(--space-block) list-none m-0 p-0 border-t border-hairline">
              {release.tracks.map((track) => {
                const duration = formatDuration(track.durationSeconds);
                return (
                  <li
                    key={track.trackNumber}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-hairline py-4"
                  >
                    <span className="w-6 shrink-0 text-step--1 text-quiet tabular-nums">
                      {track.trackNumber}
                    </span>
                    <span className="flex-1 min-w-0">{track.title}</span>
                    {track.writtenBy && (
                      <span className="text-step--1 text-quiet">{track.writtenBy}</span>
                    )}
                    {duration && (
                      <span className="text-step--1 text-quiet tabular-nums">{duration}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}
    </article>
  );
}
