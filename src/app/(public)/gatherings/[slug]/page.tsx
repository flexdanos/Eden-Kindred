import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { ParallaxMedia } from "@/components/parallax-media";
import { safe } from "@/lib/db/safe";
import { getEventBySlug } from "@/lib/db/queries/public";

export const revalidate = 300;

const full = new Intl.DateTimeFormat("en-GH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
  timeZoneName: "short",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await safe("gathering-meta", () => getEventBySlug(slug), null);

  if (!event) return { title: "Gathering not found" };

  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? undefined,
  };
}

export default async function GatheringPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await safe("gathering", () => getEventBySlug(slug), null);

  if (!event) notFound();

  const isPast = event.startsAt < new Date();

  return (
    <article>
      <section className="section">
        <div className="shell">
          <Link
            href="/gatherings"
            className="inline-flex items-center gap-2 text-step--1 text-quiet no-underline hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} aria-hidden />
            All gatherings
          </Link>

          <h1 className="m-0 mt-6 text-step-5 max-w-[18ch]">
            <SplitWords text={event.title} />
          </h1>

          <Reveal from="below" delay={0.3}>
            <div className="mt-8 flex flex-col gap-2 text-step-1 text-quiet">
              <p className="m-0 inline-flex items-center gap-2.5">
                <CalendarClock size={18} aria-hidden />
                <time dateTime={event.startsAt.toISOString()}>
                  {full.format(event.startsAt)}
                </time>
              </p>
              {event.location && (
                <p className="m-0 inline-flex items-center gap-2.5">
                  <MapPin size={18} aria-hidden />
                  {event.location}
                </p>
              )}
            </div>

            {isPast && (
              <p className="mt-6 m-0 inline-block border border-hairline bg-surface px-4 py-2 text-step--1 text-quiet">
                This one has already happened.{" "}
                <Link href="/gatherings" className="underline underline-offset-2">
                  See what is coming up
                </Link>
                .
              </p>
            )}
          </Reveal>
        </div>
      </section>

      {event.media && (
        <section className="shell">
          <ParallaxMedia
            className="w-full aspect-16/9 rounded-(--radius)"
            drift={6}
            scaleFrom={1.08}
          >
            <CmsImage
              media={event.media}
              alt={event.media.altText ?? event.title}
              sizes="(min-width: 1280px) 78rem, 100vw"
              priority
            />
          </ParallaxMedia>
        </section>
      )}

      {event.description && (
        <section className="section">
          <div className="shell">
            <Prose text={event.description} className="text-step-0" />
          </div>
        </section>
      )}

      <section className="on-brand section">
        <div className="shell">
          <h2 className="m-0 text-step-3 max-w-[18ch]">
            <SplitWords text="You do not need to tell us you are *coming*" />
          </h2>
          <p className="measure mt-5 quiet-text">
            There is no list and no ticket. Turn up a few minutes before, or a few minutes
            after — both are normal.
          </p>
        </div>
      </section>
    </article>
  );
}
