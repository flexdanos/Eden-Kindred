import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
import { Reveal, RevealItem, RevealList } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { PinnedMedia, PinnedPanel, Scene, SceneStack } from "@/components/scroll-sections";
import { safe } from "@/lib/db/safe";
import {
  getContentBlock,
  getPublishedPosts,
  getUpcomingEvents,
} from "@/lib/db/queries/public";

export const revalidate = 300;

const gatheringTime = new Intl.DateTimeFormat("en-GH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
  timeZoneName: "short",
});

const STRANDS = [
  {
    title: "Worship",
    lead: "Sung and spoken, unhurried.",
    body: "The gathering is the practice, not the warm-up to one. If you are new, this is the part where you can simply stand and listen. Nobody is counting.",
    href: "/gatherings",
    tone: "bg-brand-bg",
    seed: 3,
  },
  {
    title: "Teaching",
    lead: "Slowly, and out loud.",
    body: "We work through scripture together with room to disagree in the room rather than in the car afterwards. Questions are not an interruption of the thing; they are the thing.",
    href: "/teaching",
    tone: "bg-surface",
    seed: 11,
  },
  {
    title: "Kinship",
    lead: "Smaller rooms, real names.",
    body: "Where people know your name, your work, and what you are carrying this month. This is where belonging stops being a word on a website.",
    href: "/community",
    tone: "on-brand",
    seed: 23,
  },
];

export default async function HomePage() {
  const [hero, belonging, events, posts] = await Promise.all([
    safe("home-hero", () => getContentBlock("home-hero"), null),
    safe("home-belonging", () => getContentBlock("home-belonging"), null),
    safe("upcoming-events", () => getUpcomingEvents(3), []),
    safe("recent-posts", () => getPublishedPosts(3), []),
  ]);

  const nextGathering = events[0] ?? null;

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────
          Full-bleed imagery with overlaid type, and the split-word reveal on
          the headline — the reference site's signature opening. */}
      <section className="relative isolate min-h-[86svh] flex items-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <CmsImage
            media={hero?.media}
            alt={hero?.media?.altText ?? "The community gathered at dusk"}
            priority
            seed={7}
            sizes="100vw"
          />
          {/* Type over photography needs a floor under it, or contrast becomes
              whatever the photographer happened to shoot that day. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, oklch(0.16 0.05 16 / 0.92) 0%, oklch(0.16 0.05 16 / 0.62) 42%, oklch(0.16 0.05 16 / 0.24) 100%)",
            }}
          />
        </div>

        <div className="shell on-brand bg-transparent pb-(--space-block) pt-40 w-full">
          <h1 className="m-0 text-chalk max-w-[19ch]" style={{ fontSize: "var(--step-5)" }}>
            <SplitWords text={hero?.title ?? "A community you *belong* to."} />
          </h1>

          <Reveal from="below" delay={0.45}>
            <p className="measure mt-6 text-step-1 text-chalk/85">
              {hero?.body ??
                "Not an audience you join. We gather to worship, to learn, and to know each other by name."}
            </p>
          </Reveal>

          <Reveal from="below" delay={0.55}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 bg-chalk text-ink px-7 py-4 font-medium no-underline rounded-[var(--radius)] transition-transform duration-(--dur-fast) hover:-translate-y-0.5"
              >
                Join the community
                <ArrowRight size={17} aria-hidden />
              </Link>
              <Link
                href="/partnership"
                className="inline-flex items-center px-7 py-4 font-medium no-underline text-chalk border border-chalk/40 rounded-[var(--radius)] transition-colors hover:border-chalk"
              >
                Partner with us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Next gathering ────────────────────────────────────────────────
          Straight after the hero on purpose: a real time and a real place
          before anything is asked for. */}
      <section className="section border-b border-hairline">
        <div className="shell grid gap-(--space-block) md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <h2 className="m-0 text-step-3 max-w-[14ch]">
            <SplitWords text="The next time we *gather*" />
          </h2>

          <Reveal from="below" delay={0.08}>
            {nextGathering ? (
              <div>
                <p className="m-0 text-step-1 font-medium">{nextGathering.title}</p>
                <p className="m-0 mt-2 text-quiet">
                  {gatheringTime.format(nextGathering.startsAt)}
                </p>
                {nextGathering.location && (
                  <p className="m-0 mt-1 text-quiet inline-flex items-center gap-1.5">
                    <MapPin size={15} aria-hidden />
                    {nextGathering.location}
                  </p>
                )}
                <Link
                  href={`/gatherings/${nextGathering.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-brand-accent no-underline hover:underline"
                >
                  What to expect
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
            ) : (
              <div>
                <p className="m-0 text-step-1 font-medium">Gatherings are being scheduled.</p>
                <p className="measure m-0 mt-2 text-quiet">
                  Dates and locations appear here as soon as they are published from the
                  admin console.
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── The three strands, as stacked scenes ──────────────────────────
          Each holds the viewport while the next slides up over it. Every scene
          needs an opaque ground or the one beneath shows through — and each
          gets its own visual world, which is a permission the brand register
          grants and the product register would not. */}
      <SceneStack>
        {STRANDS.map((strand, i) => (
          <Scene key={strand.title} className={strand.tone}>
            <div className="shell grid w-full gap-8 py-20 md:grid-cols-[1fr_0.85fr] md:items-center md:gap-16">
              <div>
                <h2 className="m-0 text-step-4 max-w-[12ch]">
                  <SplitWords text={strand.title} />
                </h2>
                <p
                  className={`m-0 mt-5 text-step-1 ${
                    strand.tone === "on-brand" ? "quiet-text" : "text-quiet"
                  }`}
                >
                  {strand.lead}
                </p>
                <p className="measure m-0 mt-4">{strand.body}</p>
                <Link
                  href={strand.href}
                  className={`mt-8 inline-flex items-center gap-2 no-underline underline underline-offset-4 ${
                    strand.tone === "on-brand"
                      ? "text-chalk decoration-chalk/40 hover:decoration-chalk"
                      : "text-brand-accent decoration-transparent hover:decoration-current"
                  }`}
                >
                  More on {strand.title.toLowerCase()}
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </div>

              <figure className="relative m-0 hidden aspect-4/5 overflow-hidden rounded-[var(--radius)] md:block">
                <CmsImage
                  media={null}
                  seed={strand.seed}
                  tone={i === 2 ? "soft" : "deep"}
                  sizes="(min-width: 768px) 40vw, 0px"
                />
              </figure>
            </div>
          </Scene>
        ))}
      </SceneStack>

      {/* ── Belonging — held image, copy travelling past ───────────────── */}
      <PinnedMedia
        className="section"
        media={
          <CmsImage
            media={belonging?.media}
            alt={belonging?.media?.altText ?? "Members of the community together"}
            seed={19}
            tone="soft"
            sizes="(min-width: 768px) 45vw, 100vw"
          />
        }
      >
        <PinnedPanel>
          <h2 className="m-0 text-step-4 max-w-[15ch]">
            <SplitWords
              text={belonging?.title ?? "You are not a *visitor* here for long."}
            />
          </h2>
          <p className="measure mt-6 text-step-1 text-quiet">
            {belonging?.body ??
              "Come once and you are a guest. Come twice and someone will remember your name and ask about the thing you mentioned."}
          </p>
        </PinnedPanel>

        <PinnedPanel>
          <h3 className="m-0 text-step-2 max-w-[18ch]">
            That is the whole method. There isn&apos;t a programme underneath it.
          </h3>
          <p className="measure mt-5 text-quiet">
            No welcome desk, no visitor card, no follow-up sequence. Just people who were
            new here recently enough to remember what it felt like.
          </p>
          <Link
            href="/community"
            className="mt-8 inline-flex items-center gap-2 text-brand-accent no-underline hover:underline"
          >
            How we are put together
            <ArrowRight size={15} aria-hidden />
          </Link>
        </PinnedPanel>
      </PinnedMedia>

      {/* ── Teaching ──────────────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="section">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="m-0 text-step-3">
                <SplitWords text="Recent *teaching*" />
              </h2>
              <Link
                href="/teaching"
                className="text-brand-accent no-underline hover:underline"
              >
                Everything
              </Link>
            </div>

            <RevealList className="mt-(--space-block) list-none p-0 m-0 border-t border-hairline">
              {posts.map((post) => (
                <RevealItem key={post.slug} className="border-b border-hairline">
                  <Link
                    href={`/teaching/${post.slug}`}
                    className="group grid gap-2 py-7 no-underline md:grid-cols-[0.85fr_1.15fr] md:gap-8"
                  >
                    <h3 className="m-0 text-step-2 transition-colors group-hover:text-brand">
                      {post.title}
                    </h3>
                    <div>
                      {post.excerpt && (
                        <p className="measure m-0 text-quiet">{post.excerpt}</p>
                      )}
                      {post.publishedAt && (
                        <time
                          dateTime={post.publishedAt.toISOString()}
                          className="mt-3 block text-step--1 text-quiet"
                        >
                          {new Intl.DateTimeFormat("en-GH", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            timeZone: "Africa/Accra",
                          }).format(post.publishedAt)}
                        </time>
                      )}
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </RevealList>
          </div>
        </section>
      )}

      {/* ── Partnership ───────────────────────────────────────────────────
          Calm and specific. No countdown, no "just ₵20 will…", no sorrowful
          photograph. Partnership is participation, and the MoMo mechanics are
          stated plainly rather than glossed. */}
      <section className="section bg-surface border-t border-hairline">
        <div className="shell grid gap-(--space-block) md:grid-cols-[1fr_1fr] md:items-start">
          <div>
            <h2 className="m-0 text-step-3 max-w-[16ch]">
              <SplitWords text="The work is *funded* by the people in it" />
            </h2>
            <p className="measure mt-6 text-quiet">
              Partners give monthly by mobile money. It pays for the room, the sound, the
              travel, and the people who carry the work through the week.
            </p>
          </div>

          <Reveal delay={0.1}>
            <div className="border border-hairline bg-brand-bg p-8">
              <h3 className="m-0 text-step-1">How monthly giving works here</h3>
              <p className="measure mt-3 text-step--1 text-quiet">
                Mobile money in Ghana cannot charge you automatically — there is no
                standing authorisation to keep on file. So a monthly pledge is exactly
                that: we send you a reminder when your month comes round, and you approve
                the prompt on your own handset. Nothing is ever taken without you.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/partnership"
                  className="inline-flex items-center gap-2 bg-brand text-chalk px-6 py-3.5 font-medium no-underline rounded-[var(--radius)] transition-colors hover:bg-brand-hover"
                >
                  Become a partner
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link
                  href="/give"
                  className="inline-flex items-center px-6 py-3.5 font-medium no-underline border border-hairline rounded-[var(--radius)] transition-colors hover:border-ink"
                >
                  Give once
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
