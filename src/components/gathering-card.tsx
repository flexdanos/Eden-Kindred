import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Cta } from "@/components/cta";
import { Reveal } from "@/components/reveal";

/**
 * "Here is the next one, here is where, here is the door."
 *
 * The single most useful block the reference site has, and the one most church
 * sites bury: times and address sitting in a card near the top of the page,
 * above everything persuasive. It answers the only question a visitor who has
 * already decided to come actually has, without making them read the argument
 * for coming first — which is PRODUCT.md's "give before asking" in its most
 * literal form.
 *
 * Two departures from the reference:
 *
 * 1. It shows the NEXT DATED GATHERING, not a standing "Sundays at 9, 10:45 and
 *    12:30". Eden Kindred's programs are scheduled rows in the database, not a
 *    fixed weekly slot, so a hardcoded time would be a claim the site cannot
 *    keep true. When there is nothing on the calendar the card says so rather
 *    than disappearing — an empty calendar is information, and hiding it makes
 *    a visitor think they missed something.
 *
 * 2. The timezone is printed, always. PRODUCT.md's audience is worldwide and
 *    the gatherings are in Accra; "7pm" alone is wrong for most readers.
 *
 * No street address is invented here. `location` is whatever the admin typed
 * on the program, and the line is omitted when they typed nothing.
 */

type Gathering = {
  slug: string;
  title: string;
  location: string | null;
  startsAt: Date;
};

const dayFormat = new Intl.DateTimeFormat("en-GH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Africa/Accra",
});

const timeFormat = new Intl.DateTimeFormat("en-GH", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
  timeZoneName: "short",
});

export function GatheringCard({
  next,
  heading = "Come and sit at the back",
  blurb = "There is no sign-up and no visitor card. Turn up, sit wherever you like, and leave before the end if you want to.",
}: {
  next: Gathering | null;
  heading?: string;
  blurb?: string;
}) {
  return (
    <Reveal from="below">
      <div className="card-soft on-brand grid gap-8 p-8 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12 md:p-12">
        <div>
          <span className="eyebrow">The next gathering</span>
          <h2 className="m-0 mt-4 text-step-3 max-w-[18ch]">{heading}</h2>
          <p className="measure m-0 mt-5 quiet-text">{blurb}</p>
        </div>

        <div>
          {next ? (
            <>
              <p className="m-0 font-display text-step-2 leading-tight text-chalk">
                {next.title}
              </p>
              <ul className="m-0 mt-5 flex list-none flex-col gap-2 p-0 quiet-text">
                <li className="flex items-center gap-3">
                  <CalendarDays size={16} aria-hidden className="shrink-0" />
                  {dayFormat.format(next.startsAt)}
                </li>
                <li className="flex items-center gap-3">
                  <Clock size={16} aria-hidden className="shrink-0" />
                  {timeFormat.format(next.startsAt)}
                </li>
                {next.location && (
                  <li className="flex items-center gap-3">
                    <MapPin size={16} aria-hidden className="shrink-0" />
                    {next.location}
                  </li>
                )}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta href={`/programs/${next.slug}`} variant="inverse">
                  What this one is
                </Cta>
                <Cta href="/programs" variant="inverse-outline" arrow={false}>
                  See all programs
                </Cta>
              </div>
            </>
          ) : (
            <>
              <p className="measure m-0 quiet-text">
                Nothing is on the calendar at this moment. Dates appear here as soon as
                they are set, and this is the page to check.
              </p>
              <Cta href="/programs" variant="inverse" className="mt-8">
                See past programs
              </Cta>
            </>
          )}
        </div>
      </div>
    </Reveal>
  );
}
