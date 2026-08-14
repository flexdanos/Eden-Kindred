import type { ReactNode } from "react";

/**
 * The two scroll structures the reference site is built on. Both are pure CSS
 * `position: sticky` — no scroll listener, no pinning library, no layout
 * thrash, and they behave identically with JavaScript disabled.
 *
 * That last point matters more than it sounds: GSAP's ScrollTrigger `pin`
 * injects wrapper elements and rewrites layout on every resize. Sticky gets the
 * same effect for free, and the reference site reached the same conclusion —
 * it ships GSAP but pins with CSS.
 */

/**
 * Scenes that stack: each holds at the top of the viewport while the next
 * slides up over it.
 *
 * Children stick inside this container, so the container's own height is what
 * gives each scene its dwell time — n children of 100svh means the first scene
 * stays put for the whole (n-1) × 100svh of scrolling that follows.
 */
export function SceneStack({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`scene-stack relative ${className}`}>{children}</div>;
}

export function Scene({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`scene flex items-center overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

/**
 * A held image with copy travelling past it.
 *
 * Sticky only from the medium breakpoint up. On a phone there is no room for a
 * two-column pin, and holding a full-height image while text scrolls beside it
 * would leave almost nothing readable — so it degrades to ordinary stacked
 * flow, which is the right answer on that screen rather than a compromise.
 */
export function PinnedMedia({
  media,
  children,
  className = "",
  reverse = false,
}: {
  media: ReactNode;
  children: ReactNode;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <section className={`relative ${className}`}>
      <div className="shell grid gap-8 md:grid-cols-2 md:gap-16">
        {/* The caller supplies the frame (aspect ratio, radius, and any
            scroll-linked treatment) rather than having one imposed here — so a
            ParallaxMedia can own its own overflow context instead of being
            nested inside a second one. */}
        <div
          className={`md:sticky md:top-0 md:h-svh md:flex md:items-center md:py-16 ${
            reverse ? "md:order-2" : ""
          }`}
        >
          {media}
        </div>

        <div className={reverse ? "md:order-1" : ""}>{children}</div>
      </div>
    </section>
  );
}

/**
 * One panel of copy inside a PinnedMedia column. Full viewport height on
 * desktop so each panel gets the held image to itself for a full screen of
 * scrolling.
 */
export function PinnedPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col justify-center py-12 md:min-h-svh md:py-24 ${className}`}
    >
      {children}
    </div>
  );
}
