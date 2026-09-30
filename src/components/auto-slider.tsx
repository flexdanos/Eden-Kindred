import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A row of cards that slides sideways on its own, in a seamless loop.
 *
 * Pure CSS: the track holds the items twice and translates by -50%, so the
 * second half lands exactly where the first began and the loop has no seam.
 * No JavaScript, no timers, no layout work — one transform on one layer.
 *
 * `repeat` fills each half before it is doubled. Three cards are narrower than
 * a wide monitor, and a half narrower than the viewport would open a gap at the
 * end of every pass; repeating the set inside each half closes it.
 *
 * Accessibility:
 *  - Pauses on hover and while anything inside has keyboard focus, so a card
 *    can be read and a link can be reached.
 *  - Only the first copy is real. Every repeat is aria-hidden and inert, so a
 *    screen reader hears each card once and Tab visits each link once.
 *  - prefers-reduced-motion stops the slide and turns the row into an ordinary
 *    horizontal scroller showing only the real copy.
 */
export function AutoSlider({
  children,
  /** Seconds for one full pass. Higher is slower. */
  duration = 45,
  repeat = 2,
  /** Width of each slide. */
  itemClassName = "w-[min(22rem,80vw)]",
  className,
  label,
}: {
  children: ReactNode;
  duration?: number;
  repeat?: number;
  itemClassName?: string;
  className?: string;
  /** Names the region for assistive tech, e.g. "More ways in". */
  label: string;
}) {
  const items = Children.toArray(children);
  const copies = Math.max(1, repeat) * 2;

  return (
    <div
      role="region"
      aria-label={label}
      className={cn(
        "group relative overflow-hidden motion-reduce:overflow-x-auto",
        // Soft fade at both edges, so cards slide in and out rather than
        // being cut by the container.
        "mask-[linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className,
      )}
    >
      <div
        className="flex w-max animate-marquee group-hover:paused group-focus-within:paused motion-reduce:animate-none"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {Array.from({ length: copies }, (_, copy) => (
          <ul
            key={copy}
            aria-hidden={copy > 0 || undefined}
            inert={copy > 0 || undefined}
            className={cn(
              // Vertical padding leaves room for a card's hover lift, which
              // the overflow clip would otherwise cut off.
              "m-0 flex list-none gap-6 px-0 py-4 pr-6",
              copy > 0 && "motion-reduce:hidden",
            )}
          >
            {items.map((item, i) => (
              <li key={i} className={cn("flex shrink-0", itemClassName)}>
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
