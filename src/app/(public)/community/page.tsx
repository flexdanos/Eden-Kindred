import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
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

export default async function CommunityPage() {
  const intro = await safe("community-intro", () => getContentBlock("community-intro"), null);

  return (
    <>
      <section className="section">
        <div className="shell">
          <h1 className="m-0 text-step-5 max-w-[16ch]">
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

          <ul className="mt-(--space-block) list-none m-0 p-0 border-t border-hairline">
            {RHYTHMS.map((rhythm, i) => (
              <li key={rhythm.what} className="border-b border-hairline">
                <Reveal from="below" delay={i * 0.06}>
                  <div className="grid gap-2 py-8 md:grid-cols-[0.6fr_0.7fr_1.2fr] md:gap-8">
                    <p className="m-0 text-step--1 uppercase tracking-wider text-quiet">
                      {rhythm.when}
                    </p>
                    <h3 className="m-0 text-step-1">{rhythm.what}</h3>
                    <p className="measure m-0 text-quiet">{rhythm.detail}</p>
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
            className="m-0 w-full aspect-4/5 max-h-full rounded-(--radius)"
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
          <Link
            href="/join"
            className="mt-8 inline-flex items-center gap-2 bg-brand text-chalk px-7 py-4 font-medium no-underline rounded-(--radius) transition-colors hover:bg-brand-hover"
          >
            Come to a program
            <ArrowRight size={16} aria-hidden />
          </Link>
        </PinnedPanel>
      </PinnedMedia>
    </>
  );
}
