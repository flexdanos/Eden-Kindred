import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The public site's one call-to-action link.
 *
 * This exists because the same forty-character class string had been pasted
 * into /join, /community, /partnership and the header, and had already drifted
 * between them — two of the four used `hover:-translate-y-0.5`, one used
 * `hover:bg-brand-hover`, one did neither. A visitor moving between those pages
 * met three different buttons. One component, four variants, one place to
 * change the radius when it changes again.
 *
 * `variant` names the GROUND the button sits on, not the colour it paints
 * itself. `solid` and `outline` are for paper; `inverse` and `inverse-outline`
 * are for inside `.on-brand`, where a chalk fill is the only thing that reads.
 * Getting this wrong is the bug the unlayered-`a`-selector comment in
 * globals.css describes, so the variant list is deliberately short enough to
 * pick from correctly.
 */

type Variant = "solid" | "outline" | "inverse" | "inverse-outline" | "quiet";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-brand text-chalk hover:bg-brand-hover",
  outline: "border border-hairline text-ink hover:border-ink",
  inverse: "bg-chalk text-ink hover:bg-white",
  "inverse-outline": "border border-chalk/40 text-chalk hover:border-chalk",
  // Not a button. An underlined text link, which DESIGN.md wants distinguished
  // from buttons by weight and rule rather than by a second hue.
  quiet: "text-brand underline underline-offset-4 decoration-1 hover:decoration-2",
};

const SIZES = {
  md: "px-7 py-4",
  sm: "px-5 py-2.5 text-step--1",
} as const;

export function Cta({
  href,
  children,
  variant = "solid",
  size = "md",
  /** Trailing arrow. On by default for buttons, off for `quiet`. */
  arrow,
  className,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: keyof typeof SIZES;
  arrow?: boolean;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  const isQuiet = variant === "quiet";
  const showArrow = arrow ?? !isQuiet;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-medium no-underline transition-colors duration-(--dur-fast)",
        !isQuiet && "rounded-control",
        !isQuiet && SIZES[size],
        isQuiet && "underline",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
      {showArrow && <ArrowRight size={size === "sm" ? 15 : 16} aria-hidden />}
    </Link>
  );
}
