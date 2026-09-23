import type { Metadata } from "next";
import { CmsImage } from "@/components/cms-image";
import { Cta } from "@/components/cta";
import { NextStepList, type NextStep } from "@/components/next-step";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { PinnedMedia, PinnedPanel } from "@/components/scroll-sections";
import { ParallaxMedia } from "@/components/parallax-media";
import { PLACEHOLDER } from "@/lib/placeholder-images";
import { safe } from "@/lib/db/safe";
import { getContentBlock } from "@/lib/db/queries/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Community",
  description:
    "How Eden Kindred is put together: worship, teaching, and the smaller rooms where people know your name.",
};

const RHYTHMS = [
  {
    when: "Sunday",
    what: "The program",
    detail:
      "Everyone, in one room. Sung and spoken worship, then teaching. Around two hours, and there is tea afterwards.",
  },
  {
    when: "Midweek",
    what: "Kinship groups",
    detail:
      "Eight or ten people in someone's front room. This is where the actual knowing happens — the part a Sunday cannot do.",
  },
  {
    when: "Monthly",
    what: "The long table",
    detail:
      "One meal, everybody, no programme. Newcomers usually find this the easiest door to walk through.",
  },
];

const NEXT_STEPS: NextStep[] = [
  {
    eyebrow: "Costs an evening",
    title: "Turn up to a *program*",
    body: "The whole of it: come, sit wherever you like, leave when you want to. What happens in the room is written out in advance so you are not walking into a surprise.",
    href: "/join",
    cta: "What happens when you arrive",
    image: PLACEHOLDER.hero,
  },
  {
    eyebrow: "Costs nothing",
    title: "Or hear what it *sounds* like first",
    body: "This is a music-led community, so the recordings say more about it than another page of description would. No account and no email.",
    href: "/music",
    cta: "Hear the music",
    seed: 19,
  },
];

export default async function CommunityPage() {
  const intro = await safe("community-intro", () => getContentBlock("community-intro"), null);

  return (
    <>
      <section className="section">
        <div className="shell">
          <span className="eyebrow">Who we are</span>
          <h1 className="m-0 mt-5 text-step-5 max-w-[16ch]">
            <SplitWords
              text={intro?.title ?? "A community you *belong* to, not an audience you join."}
            />
          </h1>
          <Reveal from="below" delay={0.4}>
            <p className="measure mt-8 text-step-1 text-quiet">
              {intro?.body ??
                "There is no membership process and no visitor pathway. There are people who turn up, and after a while you are one of them."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* The rhythm — concrete times and rooms rather than adjectives. */}
      <section className="section border-t border-hairline">
        <div className="shell">
          <h2 className="m-0 text-step-3 max-w-[16ch]">
            <SplitWords text="The *rhythm* of a month" />
          </h2>

          {/* Carded rather than ruled rows. Three rhythms separated only by
              hairlines read as a table of opening hours; as panels they read
              as three different rooms, which is what they are. */}
          <ul className="mt-(--space-block) m-0 grid list-none gap-6 p-0 md:grid-cols-3">
            {RHYTHMS.map((rhythm, i) => (
              <li key={rhythm.what}>
                <Reveal from="below" delay={i * 0.06}>
                  <div className="card-soft h-full p-7">
                    <span className="eyebrow">{rhythm.when}</span>
                    <h3 className="m-0 mt-3 text-step-2">{rhythm.what}</h3>
                    <p className="m-0 mt-3 text-quiet">{rhythm.detail}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <PinnedMedia
        className="section"
        media={
          <ParallaxMedia
            className="frame m-0 w-full aspect-4/5 max-h-full"
            drift={7}
            scaleFrom={1.1}
          >
            <CmsImage
              media={null}
              fallback={PLACEHOLDER.worship}
              seed={31}
              sizes="(min-width: 768px) 45vw, 100vw"
            />
          </ParallaxMedia>
        }
      >
        <PinnedPanel>
          <h2 className="m-0 text-step-4 max-w-[16ch]">
            <SplitWords text="What we ask of *you*" />
          </h2>
          <p className="measure mt-6 text-step-1 text-quiet">
            Nothing, for as long as you need. Come and sit at the back. Leave before the
            end if you want to.
          </p>
        </PinnedPanel>

        <PinnedPanel>
          <h3 className="m-0 text-step-2 max-w-[20ch]">
            When you are ready, the ask is ordinary
          </h3>
          <p className="measure mt-5 text-quiet">
            Turn up with some regularity. Learn a few names. Join a kinship group when one
            has room. That is the whole of it — there is no tier of membership above that
            one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/join">Come to a program</Cta>
            <Cta href="/connect" variant="outline" arrow={false}>
              Other ways in
            </Cta>
          </div>
        </PinnedPanel>
      </PinnedMedia>

      {/* The path out of this page. Someone who has just read how the
          community is put together is the reader most likely to want a next
          step, and until now the page ended without offering one. */}
      <section className="section border-t border-hairline">
        <div className="shell">
          <span className="eyebrow">Where to go next</span>
          <h2 className="m-0 mt-5 text-step-3 max-w-[18ch]">
            <SplitWords text="Two doors, neither of them *urgent*" />
          </h2>
          <NextStepList className="mt-(--space-block)" steps={NEXT_STEPS} />
        </div>
      </section>
    </>
  );
}
