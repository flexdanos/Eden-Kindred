import { BrandHero } from "@/components/brand-hero";
import { CmsImage } from "@/components/cms-image";
import { Cta } from "@/components/cta";
import { PLACEHOLDER_BY_SLUG } from "@/lib/placeholder-images";
import type { HomeSection } from "@/lib/db/queries/public";

type HeroData = {
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

/**
 * The homepage opener, in the same logo-derived panel as /connect.
 *
 * Everything here comes from the hero block in /admin/content: title, body,
 * both buttons, and the image, which sits behind the panel under a sage wash.
 * With no image uploaded, the stand-in worship photograph is used.
 */
export function HeroSection({ section }: { section: HomeSection }) {
  const data = (section.data ?? {}) as HeroData;
  const primary = data.primaryLabel && data.primaryHref;
  const secondary = data.secondaryLabel && data.secondaryHref;

  return (
    <BrandHero
      title={section.title}
      body={section.body}
      background={
        <CmsImage
          media={section.media}
          alt=""
          fallback={PLACEHOLDER_BY_SLUG[section.slug]}
          priority
          sizes="100vw"
        />
      }
      actions={
        primary || secondary ? (
          <>
            {primary && <Cta href={data.primaryHref!}>{data.primaryLabel}</Cta>}
            {secondary && (
              <Cta href={data.secondaryHref!} variant="outline" arrow={false}>
                {data.secondaryLabel}
              </Cta>
            )}
          </>
        ) : undefined
      }
    />
  );
}
