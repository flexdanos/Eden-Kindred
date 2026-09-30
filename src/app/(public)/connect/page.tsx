import type { Metadata } from "next";
import { AutoSlider } from "@/components/auto-slider";
import { Cta } from "@/components/cta";
import { GatheringCard } from "@/components/gathering-card";
import { NextStepCard, NextStepList, type NextStep } from "@/components/next-step";
import { SplitWords } from "@/components/split-words";
import { PLACEHOLDER } from "@/lib/placeholder-images";
import { safe } from "@/lib/db/safe";
import { getUpcomingPrograms } from "@/lib/db/queries/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Connect",
  description:
    "Ways into the Eden Kindred worship community, ordered by how little each one asks of you. Listening costs nothing and is a real place to start.",
};

/**
 * The next-steps hub.
 *
 * ORDERING IS THE DESIGN. These are sorted by what each one costs the reader,
 * cheapest first: listening asks nothing, an evening asks an evening, a kinship
 * group asks regularity, partnership asks money. The reference site this
 * pattern comes from opens with its membership event and its giving page,
 * which is the correct order for someone already inside and exactly wrong for
 * PRODUCT.md's primary visitor — a newcomer who is "uncommitted and slightly
 * guarded", and who leaves if the first thing a page does is ask.
 *
 * Five is the cap. The reference stacks nine and the page stops being a path.
 * Anything that doesn't earn a row goes in the smaller-doors grid below, where
 * parallel options belong.
 */
const STEPS: NextStep[] = [
  {
    eyebrow: "Costs nothing",
    title: "Listen before you *decide* anything",
    body: "This is a music-led community, so the recordings are the most honest introduction to it. No account, no email, no next screen — just the songs, in the order we sing them.",
    href: "/music",
    cta: "Hear the music",
    image: PLACEHOLDER.worship,
  },
  {
    eyebrow: "Costs an hour",
    title: "Sit with the *teaching*",
    body: "What gets said on a Sunday, written down and published afterwards. Read one before you come, if you would rather know what you are walking into.",
    href: "/teaching",
    cta: "Read the teaching",
    image: PLACEHOLDER.teaching,
  },
  {
    eyebrow: "Costs an evening",
    title: "Come and sit at the *back*",
    body: "Turn up to a program. Someone will say hello and then leave you alone — you will not be asked to stand, introduce yourself, or fill anything in.",
    href: "/join",
    cta: "What happens when you arrive",
    image: PLACEHOLDER.hero,
  },
  {
    eyebrow: "Asks for some regularity",
    title: "Find the room where people know your *name*",
    body: "Eight or ten people in someone's front room, midweek. A Sunday cannot do what this does, and it is the point at which most people stop describing themselves as new.",
    href: "/community",
    cta: "How we are put together",
    seed: 23,
  },
  {
    eyebrow: "Asks for money",
    title: "Pay for something you are *part of*",
    body: "Last, and deliberately. Partnership here is participation rather than charity, it is funded by the people in the room, and nothing is ever taken without you approving it on your own handset.",
    href: "/partnership",
    cta: "How partnership works",
    seed: 41,
  },
];

/** Parallel options rather than steps on a path — hence cards, not rows. */
const SMALLER_DOORS: NextStep[] = [
  {
    eyebrow: "The people",
    title: "Who you would actually meet",
    body: "Names and faces, so the room is not a room full of strangers on the day you walk in.",
    // /people, NOT /team — /team is the musicians' area, behind a login.
    href: "/people",
    cta: "Meet the people",
    seed: 13,
  },
  {
    eyebrow: "The calendar",
    title: "Everything that is scheduled",
    body: "Every program with a date on it, each with the time in Accra and wherever it is being held.",
    href: "/programs",
    cta: "See the calendar",
    seed: 29,
  },
  {
    eyebrow: "One-off",
    title: "Give once, without committing",
    body: "A single gift, mobile money or bank transfer, with no pledge attached and no follow-up.",
    href: "/give",
    cta: "Give once",
    seed: 37,
  },
];

/**
 * ONE QUERY. Resist adding a second.
 *
 * The db client runs `max: 1` in production (see src/lib/db/index.ts), so a
 * page's queries do not overlap — they queue on a single connection, and a
 * page's build budget is 60 seconds. An earlier draft of this page also read
 * site settings to print a where/when/email block; that second query was
 * enough, against a pooler already cancelling statements, to push this route
 * and four others past the budget and fail the build.
 *
 * The gathering card below already answers where and when, from data the page
 * was fetching anyway.
 */
export default async function ConnectPage() {
  const upcoming = await safe("connect-upcoming", () => getUpcomingPrograms(1), []);
  const next = upcoming[0] ?? null;

  return (
    <>
      {/* Times and place, above everything persuasive. Give before asking. */}
      <section className="pt-(--space-block) pb-(--space-section)">
        <div className="shell">
          <GatheringCard next={next} />
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell">
          <NextStepList steps={STEPS} />
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell">
          <h2 className="m-0 text-step-3 max-w-[18ch]">
            <SplitWords text="Some *smaller* doors" />
          </h2>
          <p className="measure mt-5 text-quiet">
            Not steps, and not in any order. Take one if it is useful and ignore the rest.
          </p>
        </div>
        {/* Outside .shell so the row runs edge to edge while it slides. */}
        <AutoSlider label="Smaller doors" className="mt-(--space-block)">
          {SMALLER_DOORS.map((step, i) => (
            <NextStepCard key={step.href} step={step} index={i} asListItem={false} />
          ))}
        </AutoSlider>
      </section>

      <section className="on-brand section">
        <div className="shell">
          <h2 className="m-0 text-step-4 max-w-[17ch]">
            <SplitWords text="None of this needs a *decision* today" />
          </h2>
          <p className="measure mt-6 text-step-1 quiet-text">
            You can read this page, listen to everything on it, and come to a program
            without telling us you exist. That is not a trick to lower your guard — it is
            simply how the community works, and it does not change once you are in it.
          </p>
          <div className="mt-(--space-block) flex flex-wrap gap-3">
            <Cta href="/join" variant="inverse">
              Come to a program
            </Cta>
            <Cta href="/music" variant="inverse-outline" arrow={false}>
              Or just listen first
            </Cta>
          </div>
        </div>
      </section>
    </>
  );
}
