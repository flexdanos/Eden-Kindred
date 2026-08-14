import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { safe } from "@/lib/db/safe";
import { getPastEvents, getUpcomingEvents } from "@/lib/db/queries/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gatherings",
  description:
    "Upcoming gatherings of the Eden Kindred worship community, with times in Accra local time.",
};

const full = new Intl.DateTimeFormat("en-GH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
  timeZoneName: "short",
});

const short = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});

export default async function GatheringsPage() {
  const [upcoming, past] = await Promise.all([
    safe("gatherings-upcoming", () => getUpcomingEvents(20), []),
    safe("gatherings-past", () => getPastEvents(10), []),
  ]);

  return (
    <>
      <section className="section">
        <div className="shell">
          <h1 className="m-0 text-step-5 max-w-[14ch]">
            <SplitWords text="When we *gather*" />
          </h1>
          <Reveal from="below" delay={0.3}>
            <p className="measure mt-8 text-step-1 text-quiet">
              All times are Accra local. If you are reading this from somewhere else, the
              timezone is on every entry — we would rather say it twice than have you miss
              it by an hour.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell">
          <h2 className="m-0 text-step-3">
            <SplitWords text="*Coming* up" />
          </h2>

          {upcoming.length > 0 ? (
            <ul className="mt-(--space-block) list-none m-0 p-0 border-t border-hairline">
              {upcoming.map((event, i) => (
                <li key={event.slug} className="border-b border-hairline">
                  <Reveal from="below" delay={Math.min(i, 5) * 0.05}>
                    <Link
                      href={`/gatherings/${event.slug}`}
                      className="group grid gap-2 py-8 no-underline md:grid-cols-[0.8fr_1.2fr] md:gap-8"
                    >
                      <div>
                        <h3 className="m-0 text-step-2 transition-colors group-hover:text-brand">
                          {event.title}
                        </h3>
                        <p className="m-0 mt-2 text-step--1 text-quiet tabular-nums">
                          {full.format(event.startsAt)}
                        </p>
                      </div>
                      <div>
                        {event.description && (
                          <p className="measure m-0 text-quiet line-clamp-3">
                            {event.description}
                          </p>
                        )}
                        {event.location && (
                          <p className="m-0 mt-3 inline-flex items-center gap-1.5 text-step--1 text-quiet">
                            <MapPin size={14} aria-hidden />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <p className="measure mt-8 text-quiet">
              Nothing is scheduled at this moment. Rather than leave a stale date up, this
              page stays empty until the next one is confirmed.
            </p>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="section bg-surface border-t border-hairline">
          <div className="shell">
            <h2 className="m-0 text-step-3">
              <SplitWords text="*Already* happened" />
            </h2>
            <ul className="mt-(--space-block) list-none m-0 p-0 grid gap-x-8 gap-y-3 md:grid-cols-2">
              {past.map((event) => (
                <li key={event.slug}>
                  <Link
                    href={`/gatherings/${event.slug}`}
                    className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hairline py-3 no-underline hover:text-brand transition-colors"
                  >
                    <span>{event.title}</span>
                    <span className="text-step--1 text-quiet tabular-nums">
                      {short.format(event.startsAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
