import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { safe } from "@/lib/db/safe";
import { getActiveTiers } from "@/lib/db/queries/public";
import { formatMinor } from "@/lib/money";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Partnership",
  description:
    "Partner monthly with Eden Kindred by mobile money. What the money pays for, and how giving actually works on MoMo.",
};

const CADENCE_LABEL: Record<string, string> = {
  monthly: "a month",
  quarterly: "a quarter",
  annual: "a year",
};

export default async function PartnershipPage() {
  const tiers = await safe("partnership-tiers", () => getActiveTiers(), []);

  return (
    <>
      <section className="section">
        <div className="shell">
          <h1 className="m-0 text-step-5 max-w-[16ch]">
            <SplitWords text="The work is *funded* by the people in it" />
          </h1>
          <Reveal from="below" delay={0.4}>
            <p className="measure mt-8 text-step-1 text-quiet">
              Not by a denomination, a grant, or anyone outside the room. Partnership here
              means paying for something you are part of — which is a different act from
              charity, and we would rather not blur the two.
            </p>
          </Reveal>
        </div>
      </section>

      {/* What it pays for. Specific line items, because "supporting the
          ministry" tells a prospective partner nothing. */}
      <section className="section border-t border-hairline">
        <div className="shell">
          <h2 className="m-0 text-step-3 max-w-[16ch]">
            <SplitWords text="What the money actually *pays for*" />
          </h2>

          <ul className="mt-(--space-block) grid gap-6 list-none m-0 p-0 md:grid-cols-2">
            {[
              {
                item: "The room and its sound",
                detail:
                  "Rent, the desk, the monitors, and the person who arrives two hours early to set it all up.",
              },
              {
                item: "Travel",
                detail:
                  "Getting the team to programs, and getting people into the rooms where kinship groups meet.",
              },
              {
                item: "The people carrying it midweek",
                detail:
                  "The work that happens between Sundays, which is most of the work and none of the visible part.",
              },
              {
                item: "Whatever the month asks",
                detail:
                  "Someone's rent, a funeral, a hospital bill. This line is deliberately not itemised in advance.",
              },
            ].map((entry, i) => (
              <li key={entry.item}>
                <Reveal from="below" delay={i * 0.06}>
                  <h3 className="m-0 inline-flex items-baseline gap-2 text-step-1">
                    <Check size={16} aria-hidden className="translate-y-0.5 text-brand" />
                    {entry.item}
                  </h3>
                  <p className="measure m-0 mt-2 text-quiet">{entry.detail}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tiers */}
      {tiers.length > 0 && (
        <section className="section bg-surface border-t border-hairline">
          <div className="shell">
            <h2 className="m-0 text-step-3">
              <SplitWords text="Levels of *partnership*" />
            </h2>
            <p className="measure mt-5 text-quiet">
              The names are for convenience. Any amount is a real partnership, and nobody
              is told which level anyone else chose.
            </p>

            <ul className="mt-(--space-block) grid gap-px bg-hairline list-none m-0 p-0 border border-hairline md:grid-cols-3">
              {tiers.map((tier, i) => (
                <li key={tier.id} className="bg-brand-bg">
                  <Reveal from="below" delay={i * 0.07}>
                    <div className="flex h-full flex-col p-8">
                      <h3 className="m-0 text-step-2">{tier.name}</h3>
                      <p className="m-0 mt-3 text-step-1">
                        {formatMinor(tier.amountMinor, { showDecimals: false })}
                        <span className="text-quiet">
                          {" "}
                          {CADENCE_LABEL[tier.cadence] ?? "a month"}
                        </span>
                      </p>
                      {tier.description && (
                        <p className="m-0 mt-4 text-quiet">{tier.description}</p>
                      )}
                      <Link
                        href={`/give?tier=${tier.id}`}
                        className="mt-auto pt-7 inline-flex items-center gap-2 text-brand no-underline hover:underline underline-offset-4"
                      >
                        Partner at this level
                        <ArrowRight size={15} aria-hidden />
                      </Link>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* How MoMo actually works. The most important section on the page. */}
      <section className="on-brand section">
        <div className="shell grid gap-(--space-block) md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <h2 className="m-0 text-step-4 max-w-[16ch]">
              <SplitWords text="Nothing is ever taken *without you*" />
            </h2>
          </div>
          <Reveal from="below" delay={0.12}>
            <div className="flex flex-col gap-5">
              <p className="measure m-0 quiet-text">
                Mobile money in Ghana has no standing authorisation. There is no card on
                file, no mandate, nothing that lets anyone charge you while you are not
                looking — not us, and not the payment processor.
              </p>
              <p className="measure m-0 quiet-text">
                So a monthly pledge is a commitment plus a reminder. When your month comes
                round we send you a message, and you approve the prompt on your own handset
                with your own PIN. If you ignore it, nothing happens and nobody chases you.
              </p>
              <p className="measure m-0 quiet-text">
                That is a weaker mechanism than a direct debit, and we would rather say so
                than let you find out later.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Accountability — linked from the footer. */}
      <section id="accountability" className="section scroll-mt-24">
        <div className="shell">
          <h2 className="m-0 text-step-3 max-w-[16ch]">
            <SplitWords text="Where the money *goes*" />
          </h2>
          <div className="measure mt-6 flex flex-col gap-5 text-quiet">
            <p className="m-0">
              A breakdown of everything received and everything spent is published each
              quarter. It is not audited by anyone independent yet, and until it is we will
              keep saying so on this page.
            </p>
            <p className="m-0">
              Individual gifts are never published. Your name appears in the partners list
              only if you tick the box asking for it, and even then only your name and the
              date — never the amount.
            </p>
          </div>

          <div className="mt-(--space-block) flex flex-wrap gap-3">
            <Link
              href="/give"
              className="inline-flex items-center gap-2 bg-brand text-chalk px-7 py-4 font-medium no-underline rounded-(--radius) transition-colors hover:bg-brand-hover"
            >
              Become a partner
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/give"
              className="inline-flex items-center px-7 py-4 font-medium no-underline border border-hairline rounded-(--radius) transition-colors hover:border-ink"
            >
              Give once instead
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
