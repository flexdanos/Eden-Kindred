import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import type { HomeSection, getUpcomingEvents } from "@/lib/db/queries/public";

type GatheringPreviewData = {
  emptyTitle?: string;
  emptyBody?: string;
  linkLabel?: string;
};

const gatheringTime = new Intl.DateTimeFormat("en-GH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
  timeZoneName: "short",
});

/** Straight after the hero on purpose: a real time and a real place before anything is asked for. */
export function GatheringPreviewSection({
  section,
  events,
}: {
  section: HomeSection;
  events: Awaited<ReturnType<typeof getUpcomingEvents>>;
}) {
  const data = (section.data ?? {}) as GatheringPreviewData;
  const nextGathering = events[0] ?? null;

  return (
    <section className="section border-b border-hairline">
      <div className="shell grid gap-(--space-block) md:grid-cols-[0.9fr_1.1fr] md:items-end">
        {section.title && (
          <h2 className="m-0 text-step-3 max-w-[14ch]">
            <SplitWords text={section.title} />
          </h2>
        )}

        <Reveal from="below" delay={0.08}>
          {nextGathering ? (
            <div>
              <p className="m-0 text-step-1 font-medium">{nextGathering.title}</p>
              <p className="m-0 mt-2 text-quiet">{gatheringTime.format(nextGathering.startsAt)}</p>
              {nextGathering.location && (
                <p className="m-0 mt-1 text-quiet inline-flex items-center gap-1.5">
                  <MapPin size={15} aria-hidden />
                  {nextGathering.location}
                </p>
              )}
              <Link
                href={`/gatherings/${nextGathering.slug}`}
                className="mt-5 inline-flex items-center gap-2 text-brand no-underline hover:underline"
              >
                {data.linkLabel || "What to expect"}
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          ) : (
            (data.emptyTitle || data.emptyBody) && (
              <div>
                {data.emptyTitle && (
                  <p className="m-0 text-step-1 font-medium">{data.emptyTitle}</p>
                )}
                {data.emptyBody && (
                  <p className="measure m-0 mt-2 text-quiet">{data.emptyBody}</p>
                )}
              </div>
            )
          )}
        </Reveal>
      </div>
    </section>
  );
}
