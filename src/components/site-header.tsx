"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/music", label: "Music" },
  { href: "/community", label: "Community" },
  { href: "/programs", label: "Programs" },
  { href: "/teaching", label: "Teaching" },
  { href: "/partnership", label: "Partnership" },
];

/**
 * Sticky header, borrowed in structure from the reference template.
 *
 * Two things it deliberately does NOT do:
 *  - hide on scroll-down. On a long editorial page that costs more than it
 *    saves, and it fights the smooth scroll.
 *  - animate its own entrance. The hero is the first-load moment; a header
 *    that flies in competes with it.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  /**
   * The sheet's open state is the route it was opened on, not a boolean.
   *
   * Navigating then closes it for free — the stored path no longer matches the
   * current one — including on back/forward, which an onClick handler would
   * miss. The previous version synced a boolean from a pathname effect, which
   * meant an extra render on every navigation just to set false.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const closeMenu = () => setOpenedAt(null);

  /**
   * Publish the header's real height as --header-h.
   *
   * The mobile sheet sits directly beneath the bar, and it used to be pinned
   * with a hardcoded 64px. That is only correct at one font size: bump the
   * browser's minimum font size, land on a viewport where the wordmark wraps,
   * or add a safe-area inset, and the sheet either overlaps the bar or floats
   * below it. Measuring costs one ResizeObserver and is always right.
   */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const sync = () =>
      el.style.setProperty("--header-h", `${el.getBoundingClientRect().height}px`);

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the open sheet.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-(--z-sticky) transition-colors duration-300"
      style={{
        background: scrolled ? "color-mix(in oklch, var(--brand-bg) 92%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid var(--hairline)" : "1px solid transparent",
      }}
    >
      <div className="shell flex items-center justify-between gap-6 py-4 md:py-5">
        <Link
          href="/"
          className="font-display text-step-1 leading-none tracking-[-0.02em] no-underline"
        >
          Eden <em className="italic font-normal">Kindred</em>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7 list-none m-0 p-0">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="text-step--1 no-underline text-ink/80 hover:text-ink transition-colors data-[active=true]:text-ink"
                    data-active={active}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/join"
            className="inline-flex items-center bg-brand text-chalk px-5 py-2.5 text-step--1 font-medium no-underline rounded-[var(--radius)] transition-colors hover:bg-brand-hover"
          >
            Join us
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpenedAt(open ? null : pathname)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden inline-flex items-center justify-center p-2 -mr-2"
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      {/* Mobile sheet. Rendered in flow rather than portalled — the header is
          already the topmost stacking context on this page. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="md:hidden fixed inset-x-0 top-(--header-h,64px) bottom-0 overflow-y-auto overscroll-contain bg-brand-bg border-t border-hairline"
      >
        <nav aria-label="Primary (mobile)" className="shell py-8">
          <ul className="flex flex-col gap-1 list-none m-0 p-0">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  onClick={closeMenu}
                  href={item.href}
                  className="block font-display text-step-3 py-3 no-underline border-b border-hairline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            onClick={closeMenu}
            href="/join"
            className="mt-8 inline-flex w-full items-center justify-center bg-brand text-chalk px-6 py-4 text-step-0 font-medium no-underline rounded-(--radius)"
          >
            Join us
          </Link>
        </nav>
      </div>
    </header>
  );
}
