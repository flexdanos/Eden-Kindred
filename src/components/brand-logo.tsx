import Image from "next/image";

/**
 * The ministry's logo, from the files in public/brand.
 *
 * Two shapes:
 *  - "full": the mark beside the EDEN KINDRED wordmark. Header, footer, login.
 *  - "mark": the rounded-square mark alone. Anywhere the wordmark would be
 *    unreadable or is already set in type beside it — the admin sidebar, and
 *    the admin's dark theme, where the green wordmark disappears into the
 *    ground but the mark still carries its own background.
 *
 * Sized by height through `className`; the width follows from the intrinsic
 * ratio below, so the logo never distorts.
 */

const SOURCES = {
  full: { src: "/brand/eden-kindred-logo.png", width: 1200, height: 397 },
  mark: { src: "/brand/eden-kindred-icon.png", width: 512, height: 512 },
} as const;

type BrandLogoProps = {
  variant?: keyof typeof SOURCES;
  className?: string;
  /** Set on the header copy only — it is above the fold on every page. */
  priority?: boolean;
  /** Empty when the logo sits next to the name in text, so it is not read twice. */
  alt?: string;
};

export function BrandLogo({
  variant = "full",
  className,
  priority,
  alt = "Eden Kindred",
}: BrandLogoProps) {
  const { src, width, height } = SOURCES[variant];
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      priority={priority}
      className={className}
      style={{ width: "auto" }}
    />
  );
}
