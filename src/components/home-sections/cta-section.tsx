import { Cta } from "@/components/cta";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import type { HomeSection } from "@/lib/db/queries/public";

type CtaData = {
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryTitle?: string;
  secondaryBody?: string;
};

/** Calm and specific — a heading/body next to a highlighted sub-card with two buttons. */
export function CtaSection({ section }: { section: HomeSection }) {
  const data = (section.data ?? {}) as CtaData;

  return (
    <section className="section bg-surface border-t border-hairline">
      <div className="shell grid gap-(--space-block) md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          {section.title && (
            <h2 className="m-0 text-step-3 max-w-[16ch]">
              <SplitWords text={section.title} />
            </h2>
          )}
          {section.body && <p className="measure mt-6 text-quiet">{section.body}</p>}
        </div>

        {(data.secondaryTitle || data.secondaryBody || data.primaryLabel || data.secondaryLabel) && (
          <Reveal delay={0.1}>
            <div className="card-soft p-8">
              {data.secondaryTitle && (
                <h3 className="m-0 text-step-1">{data.secondaryTitle}</h3>
              )}
              {data.secondaryBody && (
                <p className="measure mt-3 text-step--1 text-quiet">{data.secondaryBody}</p>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                {data.primaryLabel && data.primaryHref && (
                  <Cta href={data.primaryHref}>{data.primaryLabel}</Cta>
                )}
                {data.secondaryLabel && data.secondaryHref && (
                  <Cta href={data.secondaryHref} variant="outline" arrow={false}>
                    {data.secondaryLabel}
                  </Cta>
                )}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
