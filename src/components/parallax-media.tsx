"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Scroll-linked media: the image drifts and settles as its frame crosses the
 * viewport.
 *
 * Runs on MOBILE as well as desktop, deliberately. It is pure `transform` on a
 * composited layer — no layout, no paint, no reflow — so it costs a phone
 * essentially nothing while being the single strongest signal that a page was
 * built rather than assembled. The things that actually hurt a mid-range
 * Android are layout-triggering properties and oversized images, and this
 * touches neither.
 *
 * The inner layer is inset beyond its frame so that translating it can never
 * expose an edge.
 */
export function ParallaxMedia({
  children,
  className = "",
  /** Vertical drift as a percentage of the frame, applied ± across the pass. */
  drift = 6,
  /** Scale at entry, settling to 1 at centre. */
  scaleFrom = 1.06,
}: {
  children: ReactNode;
  className?: string;
  drift?: number;
  scaleFrom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [`${-drift}%`, `${drift}%`]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [scaleFrom, 1, scaleFrom]);

  if (reduced) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0">{children}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{ y, scale }}
        // Overscan: the layer is larger than its frame, so drift never opens a
        // gap at the top or bottom edge.
        className="absolute -inset-[12%]"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * A line that draws itself in as the section arrives. Cheap punctuation between
 * sections — one composited transform, no layout.
 */
export function ScrollRule({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 92%", "start 55%"],
  });

  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className={`h-px w-full bg-hairline/40 ${className}`}>
      <motion.div
        className="h-px w-full origin-left bg-current opacity-30"
        style={reduced ? { scaleX: 1 } : { scaleX }}
      />
    </div>
  );
}
