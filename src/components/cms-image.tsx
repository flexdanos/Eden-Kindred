import Image from "next/image";
import { BrandField } from "./brand-field";
import { mediaUrl, type PublicMedia } from "@/lib/db/queries/public";

type CmsImageProps = {
  media: PublicMedia | null | undefined;
  /** Required. Falls back to the media row's own alt text when present. */
  alt?: string;
  className?: string;
  priority?: boolean;
  /** Deterministic variation for the generated stand-in. */
  seed?: number;
  tone?: "deep" | "soft";
  sizes?: string;
};

/**
 * Renders CMS photography when it exists, and a composed brand field when it
 * doesn't. Never a broken image, never an empty box.
 *
 * `fill` + `sizes` throughout: every use here is a full-bleed or aspect-boxed
 * container, and shipping a correct `sizes` is what stops a 4800px original
 * going down a 3G connection to a 360px phone.
 */
export function CmsImage({
  media,
  alt,
  className,
  priority = false,
  seed = 7,
  tone = "deep",
  sizes = "100vw",
}: CmsImageProps) {
  const url = mediaUrl(media);

  if (!url) {
    return <BrandField seed={seed} tone={tone} className={className} />;
  }

  return (
    <Image
      src={url}
      alt={alt ?? media?.altText ?? ""}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      style={{ objectFit: "cover" }}
    />
  );
}
