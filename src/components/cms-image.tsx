import Image from "next/image";
import { BrandField } from "./brand-field";
import { mediaUrl, type PublicMedia } from "@/lib/db/queries/public";
import type { PlaceholderImage } from "@/lib/placeholder-images";

type CmsImageProps = {
  media: PublicMedia | null | undefined;
  /** Required. Falls back to the media row's own alt text when present. */
  alt?: string;
  className?: string;
  priority?: boolean;
  /**
   * Stand-in photograph used when no CMS image is set. Without one, the
   * generated brand field is drawn instead.
   */
  fallback?: PlaceholderImage;
  /** Deterministic variation for the generated brand field. */
  seed?: number;
  tone?: "deep" | "soft";
  sizes?: string;
};

/**
 * Renders, in order of preference:
 *   1. CMS photography uploaded through /admin/media
 *   2. a verified stand-in photograph, when one is supplied
 *   3. the generated brand field
 *
 * Never a broken image and never an empty box. Real uploads silently take over
 * from the stand-ins the moment they exist, so shipping before the ministry's
 * own photographs arrive costs nothing later.
 *
 * `fill` + `sizes` throughout: every use is a full-bleed or aspect-boxed
 * container, and a correct `sizes` is what stops a 1600px original going down
 * a 3G connection to a 360px phone.
 */
export function CmsImage({
  media,
  alt,
  className,
  priority = false,
  fallback,
  seed = 7,
  tone = "deep",
  sizes = "100vw",
}: CmsImageProps) {
  const url = mediaUrl(media);

  if (!url && !fallback) {
    return <BrandField seed={seed} tone={tone} className={className} />;
  }

  const src = url ?? fallback!.url;
  const altText = url ? (alt ?? media?.altText ?? "") : fallback!.alt;

  return (
    <Image
      src={src}
      alt={altText}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      style={{ objectFit: "cover" }}
    />
  );
}
