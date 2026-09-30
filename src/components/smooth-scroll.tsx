"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const isFirstPath = useRef(true);
  const fromHistory = useRef(false);

  /**
   * Land at the top of every page you click through to.
   *
   * Next scrolls a new route into view itself, but Lenis keeps its own
   * scroll target and animates toward it, so the two fight: pages were
   * landing part-way down (as far as 550px on /community), with the top of
   * the page hidden under the sticky header. Snapping Lenis to 0 on each
   * route change settles it.
   *
   * Back and forward are left alone, so the browser can put you back where
   * you were on the page you return to. A link to a #section is left alone
   * too, so the anchor scroll still works.
   */
  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname]);

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
      lenisRef.current = lenis;

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
      lenisRef.current = null;
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
