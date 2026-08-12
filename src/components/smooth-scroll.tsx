"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth scroll — desktop enhancement only.
 *
 * Deliberately NOT mounted when:
 *  - the pointer is coarse or the viewport is narrow. Native scroll on a
 *    mid-range Android is smoother and cheaper than anything JS can do, and
 *    hijacking it there costs battery for a worse result.
 *  - the visitor asked for reduced motion.
 *
 * Both conditions are re-evaluated on resize and on preference change, so a
 * desktop window narrowed to phone width tears the instance down properly.
 */
export function SmoothScroll() {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopQuery = window.matchMedia("(min-width: 1024px) and (pointer: fine)");

    let lenis: Lenis | null = null;
    let frame = 0;

    const start = () => {
      if (lenis) return;
      lenis = new Lenis({
        duration: 1.05,
        // Exponential ease-out. No overshoot, no bounce.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
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
      if (desktopQuery.matches && !motionQuery.matches) start();
      else stop();
    };

    sync();
    motionQuery.addEventListener("change", sync);
    desktopQuery.addEventListener("change", sync);

    return () => {
      motionQuery.removeEventListener("change", sync);
      desktopQuery.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}
