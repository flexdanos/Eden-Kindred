import { CmsImage } from "@/components/cms-image";
import { Cta } from "@/components/cta";
import { ParallaxMedia } from "@/components/parallax-media";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import type { PlaceholderImage } from "@/lib/placeholder-images";
import type { PublicMedia } from "@/lib/db/queries/public";
import { cn } from "@/lib/utils";

/**
 * The next-step row: a photograph, a short piece of writing, and exactly one
 * link out.
 *
 * This is the pattern worth taking from the reference site, and the reason is
 * the constraint rather than the composition. Each of its rows offers ONE
 * action. A visitor scrolling a page of them is never asked to compare options,
 * only to keep going or stop — which is the right shape for PRODUCT.md's
 * primary reader, who arrives uncommitted and will leave if the page opens with
 * a decision. A three-column grid of equally-weighted cards asks for that
 * decision on every screen; a stack of single-action rows never does.
 *
 * What is NOT taken from it: the reference stacks nine of these, at which point
 * the page stops being a path and becomes a directory. Keep a list to five or
 * six, ordered by how little they ask.
 *
 * Alternation is by index, and it is not decoration — it is what stops six
 * identical rows reading as a template. It collapses below `md`, where the
 * image always leads, because a stacked row whose picture sometimes comes
 * second just looks like a layout bug on a phone.
 */

export type NextStep = {
  /** Small all-caps label. Names the step; the heading sells it. */
  eyebrow: string;
  /** Supports the brand's `*emphasis*` marker — see SplitWords. */
  title: string;
  body: string;
  href: string;
  cta: string;
  /** Stand-in photograph. Omit to fall through to the generated brand field. */
  image?: PlaceholderImage;
  /** CMS photography, when the step is backed by an editable block. */
  media?: PublicMedia | null;
  /** Varies the generated field when there is no photograph. */
  seed?: number;
};

export function NextStepRow({
  step,
  index,
  className,
}: {
  step: NextStep;
  index: number;
  className?: string;
}) {
  const imageRight = index % 2 === 1;

  return (
    <li className={cn("list-none", className)}>
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
        <Reveal
          from={imageRight ? "right" : "left"}
          className={cn(imageRight && "md:order-2")}
        >
          <ParallaxMedia className="frame aspect-4/3 w-full" drift={5} scaleFrom={1.08}>
            <CmsImage
              media={step.media ?? null}
              fallback={step.image}
              seed={step.seed ?? index * 11 + 3}
              sizes="(min-width: 768px) 46vw, 92vw"
            />
          </ParallaxMedia>
        </Reveal>

        <Reveal from="below" delay={0.1}>
          <span className="eyebrow">{step.eyebrow}</span>
          <h3 className="m-0 mt-4 text-step-3 max-w-[18ch]">
            <SplitWords text={step.title} />
          </h3>
          <p className="measure m-0 mt-5 text-quiet">{step.body}</p>
          <Cta href={step.href} className="mt-8">
            {step.cta}
          </Cta>
        </Reveal>
      </div>
    </li>
  );
}

/**
 * A list of rows with the vertical rhythm already set.
 *
 * `--space-block` between rows rather than `--space-section`: these belong to
 * one another and should read as a single path, not as six separate sections
 * that happen to be adjacent.
 */
export function NextStepList({
  steps,
  className,
}: {
  steps: NextStep[];
  className?: string;
}) {
  return (
    <ul className={cn("m-0 grid list-none gap-(--space-section) p-0", className)}>
      {steps.map((step, i) => (
        <NextStepRow key={step.href + step.eyebrow} step={step} index={i} />
      ))}
    </ul>
  );
}

/**
 * The compact form: photograph on top, text beneath, in a grid.
 *
 * For steps that genuinely are parallel — three ways to listen, say — where
 * the visitor is picking one of a set rather than walking a path. Using this
 * where a row belongs is how a page ends up asking for a comparison it did not
 * mean to ask for.
 */
export function NextStepCard({ step, index }: { step: NextStep; index: number }) {
  return (
    <li className="list-none">
      <Reveal from="below" delay={index * 0.07}>
        <article className="card-soft flex h-full flex-col overflow-hidden">
          <ParallaxMedia className="aspect-16/10 w-full" drift={4} scaleFrom={1.06}>
            <CmsImage
              media={step.media ?? null}
              fallback={step.image}
              seed={step.seed ?? index * 17 + 5}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            />
          </ParallaxMedia>

          <div className="flex flex-1 flex-col p-7">
            <span className="eyebrow">{step.eyebrow}</span>
            <h3 className="m-0 mt-3 text-step-1">{step.title.replace(/\*/g, "")}</h3>
            <p className="m-0 mt-3 text-quiet">{step.body}</p>
            <Cta href={step.href} variant="quiet" className="mt-auto pt-6">
              {step.cta}
            </Cta>
          </div>
        </article>
      </Reveal>
    </li>
  );
}
