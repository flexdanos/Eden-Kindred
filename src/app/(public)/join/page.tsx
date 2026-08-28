import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { safe } from "@/lib/db/safe";
import { getUpcomingPrograms } from "@/lib/db/queries/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Join us",
  description:
    "Come to a program of the Eden Kindred worship community in Accra. No sign-up, no visitor card.",
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

export default async function JoinPage() {
  const events = await safe("join-programs", () => getUpcomingPrograms(4), []);

  return (
    <>
      <section className="section">
        <div className="shell">
          <h1 className="m-0 text-step-5 max-w-[14ch]">
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

      <section className="section border-t border-hairline">
        <div className="shell">
          <h2 className="m-0 text-step-3 max-w-[16ch]">
            <SplitWords text="The next few *programs*" />
          </h2>

          {events.length > 0 ? (
            <ul className="mt-(--space-block) list-none m-0 p-0 border-t border-hairline">
              {events.map((event, i) => (
                <li key={event.slug} className="border-b border-hairline">
                  <Reveal from="below" delay={i * 0.06}>
                    <Link
                      href={`/programs/${event.slug}`}
                      className="group grid gap-2 py-8 no-underline md:grid-cols-[1fr_1.2fr] md:gap-8"
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
          <h2 className="m-0 text-step-4 max-w-[16ch]">
            <SplitWords text="What actually *happens* when you arrive" />
          </h2>

          <ul className="mt-(--space-block) grid gap-8 list-none m-0 p-0 md:grid-cols-3">
            {[
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
            ].map((item, i) => (
              <li key={item.q}>
                <Reveal from="below" delay={i * 0.07}>
                  <h3 className="m-0 text-step-1 text-chalk">{item.q}</h3>
                  <p className="m-0 mt-3 quiet-text">{item.a}</p>
                </Reveal>
              </li>
            ))}
          </ul>

          <Reveal from="below" delay={0.25}>
            <div className="mt-(--space-block) flex flex-wrap gap-3">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 bg-chalk text-ink px-7 py-4 font-medium no-underline rounded-(--radius) transition-transform duration-(--dur-fast) hover:-translate-y-0.5"
              >
                See all programs
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center px-7 py-4 font-medium no-underline text-chalk border border-chalk/40 rounded-(--radius) transition-colors hover:border-chalk"
              >
                How we are put together
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
