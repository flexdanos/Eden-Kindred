import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { ParallaxMedia } from "@/components/parallax-media";
import { ProgramStatusBadge } from "@/components/program-status-badge";
import { ProgramGallery } from "@/components/program-gallery";
import { ProgramCommentForm } from "@/components/program-comment-form";
import { safe } from "@/lib/db/safe";
import { getProgramBySlug, getProgramComments } from "@/lib/db/queries/public";

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

const commentDate = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await safe("program-meta", () => getProgramBySlug(slug), null);

  if (!event) return { title: "Program not found" };

  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await safe("program", () => getProgramBySlug(slug), null);

  if (!event) notFound();

  const isPast = event.startsAt < new Date();
  const comments = await safe("program-comments", () => getProgramComments(event.id), []);

  return (
    <article>
      <section className="section">
        <div className="shell">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-step--1 text-quiet no-underline hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} aria-hidden />
            All programs
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-step-5 max-w-[18ch]">
              <SplitWords text={event.title} />
            </h1>
            <ProgramStatusBadge isPast={isPast} />
          </div>

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
                <Link href="/programs" className="underline underline-offset-2">
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

      {event.gallery.length > 0 && (
        <section className="section border-t border-hairline">
          <div className="shell">
            <h2 className="m-0 text-step-3">
              <SplitWords text="*Photos*" />
            </h2>
            <ProgramGallery images={event.gallery} />
          </div>
        </section>
      )}

      <section className="section border-t border-hairline">
        <div className="shell">
          <h2 className="m-0 text-step-3">
            <SplitWords
              text={comments.length > 0 ? `*Comments* (${comments.length})` : "*Comments*"}
            />
          </h2>

          <div className="mt-(--space-block) max-w-2xl">
            <ProgramCommentForm eventId={event.id} slug={event.slug} />
          </div>

          {comments.length > 0 && (
            <ul className="mt-(--space-block) list-none m-0 p-0 max-w-2xl flex flex-col gap-6 border-t border-hairline pt-8">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <p className="m-0 text-step-0 font-medium">
                    {comment.authorName}
                    <span className="ml-2 font-normal text-step--1 text-quiet">
                      {commentDate.format(comment.createdAt)}
                    </span>
                  </p>
                  <p className="measure m-0 mt-1.5 text-quiet whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

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
