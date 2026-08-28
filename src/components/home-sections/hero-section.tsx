import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
import { ParallaxMedia } from "@/components/parallax-media";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { PLACEHOLDER_BY_SLUG } from "@/lib/placeholder-images";
import type { HomeSection } from "@/lib/db/queries/public";

type HeroData = {
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

/** Full-bleed imagery with overlaid type, and the split-word reveal on the headline. */
export function HeroSection({ section }: { section: HomeSection }) {
  const data = (section.data ?? {}) as HeroData;

  return (
    <section className="relative isolate min-h-[86svh] flex items-end overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {/* Slow drift on the hero as the page leaves it. Larger overscan than
            the inline media, because a full-bleed frame shows an exposed edge
            far more readily. */}
        <ParallaxMedia className="absolute inset-0" drift={8} scaleFrom={1.12}>
          <CmsImage
            media={section.media}
            alt={section.media?.altText ?? section.title ?? ""}
            fallback={PLACEHOLDER_BY_SLUG[section.slug]}
            priority
            seed={7}
            sizes="100vw"
          />
        </ParallaxMedia>
        {/* Type over photography needs a floor under it, or contrast becomes
            whatever the photographer happened to shoot that day.

            The floor is oxblood, not neutral black — the brand colour is what
            should be darkening the image, so the photograph reads as part of
            the palette rather than sitting behind a generic scrim. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.38 0.145 12 / 0.96) 0%, oklch(0.35 0.135 14 / 0.72) 46%, oklch(0.32 0.12 16 / 0.28) 100%)",
          }}
        />
      </div>

      {/* `.on-brand` supplies the oxblood ground behind the headline. It is
          NOT bg-transparent: the scrim's bottom stop is the same oxblood at
          0.96 alpha, so the panel and the gradient meet without a visible
          band and the whole hero reads as one drenched field. */}
      <div className="shell on-brand pb-(--space-block) pt-28 md:pt-40 w-full">
        {section.title && (
          <h1 className="m-0 text-chalk max-w-[19ch]" style={{ fontSize: "var(--step-5)" }}>
            <SplitWords text={section.title} />
          </h1>
        )}

        {section.body && (
          <Reveal from="below" delay={0.45}>
            <p className="measure mt-6 text-step-1 text-chalk/85">{section.body}</p>
          </Reveal>
        )}

        {(data.primaryLabel || data.secondaryLabel) && (
          <Reveal from="below" delay={0.55}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {data.primaryLabel && data.primaryHref && (
                <Link
                  href={data.primaryHref}
                  className="inline-flex items-center gap-2 bg-chalk text-ink px-7 py-4 font-medium no-underline rounded-[var(--radius)] transition-transform duration-(--dur-fast) hover:-translate-y-0.5"
                >
                  {data.primaryLabel}
                  <ArrowRight size={17} aria-hidden />
                </Link>
              )}
              {data.secondaryLabel && data.secondaryHref && (
                <Link
                  href={data.secondaryHref}
                  className="inline-flex items-center px-7 py-4 font-medium no-underline text-chalk border border-chalk/40 rounded-[var(--radius)] transition-colors hover:border-chalk"
                >
                  {data.secondaryLabel}
                </Link>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
