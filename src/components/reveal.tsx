"use client";

import { type ReactNode } from "react";
import * as motion from "motion/react-client";
import { useReducedMotion } from "motion/react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Direction the content settles from. `none` fades only. */
  from?: "below" | "left" | "right" | "none";
  delay?: number;
  /** Distance in px. Kept small on purpose — big travel reads as a template. */
  distance?: number;
  as?: "div" | "section" | "li" | "article" | "figure";
};

const OFFSETS = {
  below: (d: number) => ({ y: d, x: 0 }),
  left: (d: number) => ({ x: -d, y: 0 }),
  right: (d: number) => ({ x: d, y: 0 }),
  none: () => ({ x: 0, y: 0 }),
};

/**
 * A scroll reveal that ENHANCES an already-visible default.
 *
 * The critical detail: the element's resting state is opacity 1. Motion
 * animates *from* the offset state, so if JS never runs, the viewport is
 * headless, or the tab is hidden when the trigger would have fired, the content
 * is still there. Gating visibility behind a class-triggered transition is how
 * sections ship blank.
 *
 * `useReducedMotion` collapses this to a plain render, not a shorter animation.
 */
export function Reveal({
  children,
  className,
  from = "below",
  delay = 0,
  distance = 18,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const offset = OFFSETS[from](distance);

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{
        duration: 0.72,
        delay,
        ease: [0.16, 1, 0.3, 1], // ease-out-expo
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggered children. Legitimate for one list — the tell is applying an
 * identical entrance to every section on the page, not staggering itself.
 */
export function RevealList({
  children,
  className,
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <ul className={className}>{children}</ul>;

  return (
    <motion.ul
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.ul>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <li className={className}>{children}</li>;

  return (
    <motion.li
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.li>
  );
}
