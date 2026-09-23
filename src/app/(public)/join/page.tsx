import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Cta } from "@/components/cta";
import { GatheringCard } from "@/components/gathering-card";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { safe } from "@/lib/db/safe";
import { getUpcomingPrograms } from "@/lib/db/queries/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Join us",
  description:
    "Come to a program of the Eden Kindred worship community. No sign-up, no visitor card, and here is exactly what happens when you arrive.",
};

const programTime = new Intl.DateTimeFormat("en-GH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
  timeZoneName: "short",
});

const QUESTIONS = [
  {
    q: "Will anyone make a fuss of me?",
    a: "Someone will say hello and then leave you alone. You will not be asked to stand up, introduce yourself, or fill anything in.",
  },
  {
    q: "What should I wear?",
    a: "Whatever you have on. People come from work, from home, and from other people's weddings.",
  },
  {
    q: "Can I bring my children?",
    a: "Yes, and they do not need to be quiet. Nobody here is concentrating that hard.",
  },
];

export default async function JoinPage() {
  const events = await safe("join-programs", () => getUpcomingPrograms(4), []);

  return (
    <>
      <section className="section">
        <div className="shell">
          <span className="eyebrow">Come to a program</span>
          <h1 className="m-0 mt-5 text-step-5 max-w-[14ch]">
            <SplitWords text="Come and *sit* at the back." />
          </h1>
          <Reveal from="below" delay={0.35}>
            <p className="measure mt-8 text-step-1 text-quiet">
              That is genuinely the whole invitation. There is no form on this page,
              because joining this community is a thing you do by arriving, not by
              registering.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Times and place before anything else, same as /connect. Someone who
          arrived here having already decided to come should not have to read
          the argument for coming. */}
      <section className="pb-(--space-section)">
        <div className="shell">
          <GatheringCard next={events[0] ?? null} />
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell">
          <h2 className="m-0 text-step-3 max-w-[16ch]">
            <SplitWords text="The next few *programs*" />
          </h2>

          {events.length > 0 ? (
            <ul className="mt-(--space-block) m-0 grid list-none gap-4 p-0">
              {events.map((event, i) => (
                <li key={event.slug}>
                  <Reveal from="below" delay={i * 0.06}>
                    {/* The whole card is the target, not the title alone. On a
                        phone the date and the place are what people aim at,
                        and in the previous list neither was tappable. */}
                    <Link
                      href={`/programs/${event.slug}`}
                      className="card-soft group grid items-center gap-2 p-7 no-underline transition-colors hover:border-ink/30 md:grid-cols-[1fr_1.2fr] md:gap-8"
                    >
                      <h3 className="m-0 text-step-2 transition-colors group-hover:text-brand">
                        {event.title}
                      </h3>
                      <div className="text-quiet">
                        <p className="m-0 inline-flex items-center gap-2">
                          <Clock size={15} aria-hidden />
                          {programTime.format(event.startsAt)}
                        </p>
                        {event.location && (
                          <p className="m-0 mt-1 inline-flex items-center gap-2">
                            <MapPin size={15} aria-hidden />
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
              Nothing is on the calendar at this moment. Dates appear here as soon as they
              are set — this page is the one to check.
            </p>
          )}
        </div>
      </section>

      {/* What to expect. The single most useful thing for someone deciding
          whether to walk in, and the thing most sites leave out. */}
      <section className="on-brand section">
        <div className="shell">
          <span className="eyebrow">Before you come</span>
          <h2 className="m-0 mt-5 text-step-4 max-w-[16ch]">
            <SplitWords text="What actually *happens* when you arrive" />
          </h2>

          <ul className="mt-(--space-block) grid gap-6 list-none m-0 p-0 md:grid-cols-3">
            {QUESTIONS.map((item, i) => (
              <li key={item.q}>
                <Reveal from="below" delay={i * 0.07}>
                  {/* Carded rather than loose columns. Three questions in a row
                      of bare text read as one paragraph broken in three; the
                      panel is what makes each one a discrete answer. */}
                  <div className="h-full rounded-card border border-chalk/25 p-7">
                    <h3 className="m-0 text-step-1 text-chalk">{item.q}</h3>
                    <p className="m-0 mt-3 quiet-text">{item.a}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>

          <Reveal from="below" delay={0.25}>
            <div className="mt-(--space-block) flex flex-wrap gap-3">
              <Cta href="/programs" variant="inverse">
                See all programs
              </Cta>
              <Cta href="/connect" variant="inverse-outline" arrow={false}>
                Other ways in
              </Cta>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
