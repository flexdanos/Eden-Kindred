"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth scroll, mounted at every viewport width.
 *
 * It used to be gated to wide, pointer-fine screens. That was over-cautious:
 * Lenis only intercepts WHEEL events by default, so on a phone it is inert
 * anyway — the narrow-screen gate bought nothing and cost the effect on
 * laptops in a narrowed window.
 *
 * Touch stays on the platform's own momentum physics (`syncTouch: false`).
 * That is the one line here worth defending: smoothing touch replaces scroll
 * behaviour a phone user already has muscle memory for with something that
 * feels laggy, and it burns battery to do it.
 *
 * Reduced motion tears the instance down entirely, and the preference is
 * re-evaluated if it changes mid-session.
 */
export function SmoothScroll() {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let lenis: Lenis | null = null;
    let frame = 0;

    const start = () => {
      if (lenis) return;
      lenis = new Lenis({
        duration: 1.05,
        // Exponential ease-out. No overshoot, no bounce.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // Touch is left on the platform's own momentum scrolling. Lenis does
        // not smooth touch by default and it should stay that way — hijacking
        // a phone's native scroll physics feels worse than the thing it
        // replaces and costs battery. The reference site runs Lenis globally
        // on the same terms.
        syncTouch: false,
        touchMultiplier: 1,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
    };

    const sync = () => {
      if (motionQuery.matches) stop();
      else start();
    };

    sync();
    motionQuery.addEventListener("change", sync);

    return () => {
      motionQuery.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}
