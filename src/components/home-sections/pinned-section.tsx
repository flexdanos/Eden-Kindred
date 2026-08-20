import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
import { ParallaxMedia } from "@/components/parallax-media";
import { PinnedMedia, PinnedPanel } from "@/components/scroll-sections";
import { SplitWords } from "@/components/split-words";
import { PLACEHOLDER_BY_SLUG } from "@/lib/placeholder-images";
import type { HomeSection } from "@/lib/db/queries/public";

type PinnedData = {
  secondaryTitle?: string;
  secondaryBody?: string;
  linkLabel?: string;
  linkHref?: string;
};

/** A held image with copy travelling past it, as two text panels. */
export function PinnedSection({ section }: { section: HomeSection }) {
  const data = (section.data ?? {}) as PinnedData;

  return (
    <PinnedMedia
      className="section"
      media={
        <ParallaxMedia
          className="m-0 w-full aspect-4/5 max-h-full rounded-(--radius)"
          drift={7}
          scaleFrom={1.1}
        >
          <CmsImage
            media={section.media}
            alt={section.media?.altText ?? section.title ?? ""}
            fallback={PLACEHOLDER_BY_SLUG[section.slug]}
            seed={19}
            tone="soft"
            sizes="(min-width: 768px) 45vw, 100vw"
          />
        </ParallaxMedia>
      }
    >
      <PinnedPanel>
        {section.title && (
          <h2 className="m-0 text-step-4 max-w-[15ch]">
            <SplitWords text={section.title} />
          </h2>
        )}
        {section.body && <p className="measure mt-6 text-step-1 text-quiet">{section.body}</p>}
      </PinnedPanel>

      {(data.secondaryTitle || data.secondaryBody) && (
        <PinnedPanel>
          {data.secondaryTitle && (
            <h3 className="m-0 text-step-2 max-w-[18ch]">{data.secondaryTitle}</h3>
          )}
          {data.secondaryBody && <p className="measure mt-5 text-quiet">{data.secondaryBody}</p>}
          {data.linkLabel && data.linkHref && (
            <Link
              href={data.linkHref}
              className="mt-8 inline-flex items-center gap-2 text-brand no-underline hover:underline"
            >
              {data.linkLabel}
              <ArrowRight size={15} aria-hidden />
            </Link>
          )}
        </PinnedPanel>
      )}
    </PinnedMedia>
  );
}
