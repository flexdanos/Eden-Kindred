import { BrandLogo } from "@/components/brand-logo";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";

/**
 * The page-opening panel used by the homepage and /connect.
 *
 * The logo's own geometry, borrowed for the page ground: a sage panel, a faint
 * green diagonal where the logo's white band runs, and the teal wedge from its
 * bottom-right corner. Both shapes are decoration only, so they sit behind the
 * copy and are hidden from assistive tech.
 *
 * The mark shows from `lg` up. Below that there is no room beside the copy,
 * and stacking it above the headline would push the headline off a phone's
 * first screen.
 */
export function BrandHero({
  eyebrow,
  title,
  body,
  actions,
  background,
}: {
  eyebrow?: string;
  /** SplitWords syntax: `*word*` is set in italic. */
  title?: string | null;
  body?: React.ReactNode;
  actions?: React.ReactNode;
  /**
   * Optional photograph behind the panel — a filling image (`CmsImage`).
   * It sits under a sage wash that is heaviest behind the copy, so the green
   * headline keeps its contrast whatever the photograph is.
   */
  background?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-surface">
      {background && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* Slow drift-and-zoom, so the photograph breathes rather than sits. */}
          <div className="absolute inset-0 animate-kenburns">{background}</div>
          {/* Below lg the copy runs the full width, so the wash stays even. */}
          <div className="absolute inset-0 bg-surface/90 lg:hidden" />
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                // Strong under the copy column (roughly the left 45%), then
                // opening up so the photograph reads on the right.
                "linear-gradient(to right, color-mix(in oklch, var(--brand-surface) 94%, transparent) 0%, color-mix(in oklch, var(--brand-surface) 88%, transparent) 45%, color-mix(in oklch, var(--brand-surface) 40%, transparent) 100%)",
            }}
          />
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[70%] bg-brand/6"
        style={{ clipPath: "polygon(45% 0, 100% 0, 100% 58%, 0 100%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[22%] w-full animate-slide-in-right bg-brand-accent-bright [animation-delay:200ms] lg:h-[44%] lg:w-[62%]"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />

      <div className="shell relative section grid items-center gap-10 pb-[calc(var(--space-section)+4rem)] lg:grid-cols-[1.25fr_0.75fr] lg:pb-(--space-section)">
        <div>
          {eyebrow && <span className="eyebrow text-brand-accent">{eyebrow}</span>}
          {title && (
            <h1 className={`m-0 text-step-5 max-w-[15ch] text-brand ${eyebrow ? "mt-5" : ""}`}>
              <SplitWords text={title} />
            </h1>
          )}
          {(body || actions) && (
            <Reveal from="below" delay={0.35}>
              {body && <p className="measure mt-8 text-step-1 text-quiet">{body}</p>}
              {actions && (
                <div className="mt-(--space-block) flex flex-wrap gap-3">{actions}</div>
              )}
            </Reveal>
          )}
        </div>

        {/* Two layers on purpose: the outer pops in once with a spring
            overshoot, the inner floats for as long as the page is open.
            One element cannot run both, because each animation owns
            `transform`. */}
        <div className="hidden justify-self-center animate-pop [animation-delay:350ms] lg:block">
          <BrandLogo
            variant="mark"
            alt=""
            priority
            className="h-auto max-w-68 animate-float drop-shadow-[0_24px_48px_rgba(8,90,61,0.25)] [animation-delay:1.2s]"
          />
        </div>
      </div>
    </section>
  );
}
