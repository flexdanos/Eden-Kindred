"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The reference site's signature heading move: words lift and fade in, one
 * after another.
 *
 * Two deliberate departures from how that site does it:
 *
 * 1. ACCESSIBILITY. It marks every word `aria-hidden="true"` with no
 *    replacement, so its headings are literally empty to a screen reader — an
 *    <h2> announcing nothing. Here the full sentence is rendered once in an
 *    sr-only span and only the decorative word copies are hidden, so the
 *    heading keeps its accessible name.
 *
 * 2. COST. The animation is CSS; this component only flips one attribute when
 *    the heading scrolls into view. Mounting an animation node per word would
 *    put ten of them in a single headline, which is a real frame cost on the
 *    mid-range Android most of this audience is using.
 *
 * Emphasis: wrap words in *asterisks* to render them as <em>, which is the
 * brand's one typographic device.
 *
 *   <SplitWords text="A community you *belong* to." />
 */

type Word = { word: string; em: boolean };

function parseWords(text: string): Word[] {
  const out: Word[] = [];
  for (const part of text.split(/(\*[^*]+\*)/g)) {
    if (!part) continue;
    const em = part.length > 2 && part.startsWith("*") && part.endsWith("*");
    const raw = em ? part.slice(1, -1) : part;
    for (const word of raw.split(/\s+/)) {
      if (word) out.push({ word, em });
    }
  }
  return out;
}

const stripMarkers = (text: string) => text.replace(/\*/g, "");

export function SplitWords({
  text,
  className,
  /** Extra stagger offset, for a second line that should follow the first. */
  indexOffset = 0,
}: {
  text: string;
  className?: string;
  indexOffset?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: show immediately, never animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    // Already on screen at mount (the hero) — reveal on the next frame so the
    // transition still runs rather than snapping.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = parseWords(text);

  return (
    <span ref={ref} data-revealed={revealed} className={className}>
      {/* The accessible copy — the only one a screen reader sees. */}
      <span className="sr-only">{stripMarkers(text)}</span>

      <span aria-hidden="true">
        {words.map((w, i) =>
          w.em ? (
            <em key={i} className="split-word" style={{ "--i": i + indexOffset } as React.CSSProperties}>
              {w.word + " "}
            </em>
          ) : (
            <span key={i} className="split-word" style={{ "--i": i + indexOffset } as React.CSSProperties}>
              {w.word + " "}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
