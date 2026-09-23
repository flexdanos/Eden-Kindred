"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuthModal } from "@/components/auth/auth-modal-context";
import { AccountMenu } from "@/components/auth/account-menu";
import { Cta } from "@/components/cta";
import { useAuthUser } from "@/components/auth/use-auth-user";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/connect", label: "Connect" },
  { href: "/music", label: "Music" },
  { href: "/community", label: "Community" },
  { href: "/programs", label: "Programs" },
  { href: "/teaching", label: "Teaching" },
  { href: "/partnership", label: "Partnership" },
];

/**
 * The sheet groups where the bar cannot.
 *
 * Six flat links in a column tell a newcomer nothing about which one to press
 * first. The reference site's menu solves this by grouping under headings, and
 * the grouping is the useful part: "Start here" is a recommendation, and a
 * guarded first-time visitor is exactly the reader who needs one.
 *
 * The order inside each group is the same cost-ordering /connect uses — the
 * cheapest thing to do is always the first link.
 */
const NAV_GROUPS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Start here",
    links: [
      { href: "/connect", label: "Ways in" },
      { href: "/music", label: "Music" },
      { href: "/join", label: "Come to a program" },
    ],
  },
  {
    heading: "The community",
    links: [
      { href: "/community", label: "Who we are" },
      { href: "/team", label: "The people" },
      { href: "/programs", label: "Programs" },
      { href: "/teaching", label: "Teaching" },
    ],
  },
  {
    heading: "Partnership",
    links: [
      { href: "/partnership", label: "Become a partner" },
      { href: "/give", label: "Give once" },
    ],
  },
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
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  /**
   * Three states: `undefined` while the check is in flight, `null` signed out,
   * an object signed in. The give form needs exactly the same answer, so this
   * lives in one hook rather than being subscribed to twice.
   */
  const account = useAuthUser();
  const signedIn = Boolean(account);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  function handleAccountClick() {
    if (signedIn) {
      void signOut();
      return;
    }
    openAuthModal({ reason: "Sign in to save your place in this community." });
  }

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
        // Paper, not white: the bar now condenses over a warm ground, and
        // frosting it with --brand-bg left a visibly cooler strip across the
        // top of every page.
        background: scrolled
          ? "color-mix(in oklch, var(--brand-paper) 92%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid var(--hairline)" : "1px solid transparent",
      }}
    >
      <div className="shell flex items-center justify-between gap-6 py-4 lg:py-5">
        <Link
          href="/"
          className="font-display text-step-1 leading-none tracking-[-0.02em] no-underline"
        >
          Eden <em className="italic font-normal">Kindred</em>
        </Link>

        {/* `lg`, not `md`. Adding Connect made six items, and six plus the
            wordmark plus two account controls does not fit a 768px bar without
            the nav wrapping into the CTA. Tablets get the grouped sheet, which
            is the better surface for six links anyway. */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-6 list-none m-0 p-0">
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

        {/* Signed in, the pair collapses to one account control. Leaving "Join
            us" up for someone who has already joined is the thing that made it
            read as "you are not in yet". While the check is unresolved the slot
            reserves its width so the header does not shift. */}
        <div className="hidden lg:flex items-center gap-5">
          {account === undefined ? (
            <div className="size-9" aria-hidden />
          ) : account ? (
            <AccountMenu email={account.email} onSignOut={signOut} />
          ) : (
            <>
              <button
                type="button"
                onClick={handleAccountClick}
                className="text-step--1 text-ink/80 hover:text-ink transition-colors"
              >
                Sign in
              </button>
              <Cta href="/join" size="sm" arrow={false}>
                Join us
              </Cta>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpenedAt(open ? null : pathname)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="lg:hidden inline-flex items-center gap-2 p-2 -mr-2"
        >
          {/* The reference labels its toggle MENU / CLOSE rather than leaving a
              bare hamburger, and it is right to: the icon alone is a guess for
              anyone who is not a frequent web user, which describes a fair
              share of this audience. The word is hidden from screen readers
              because aria-label already says it. */}
          <span className="eyebrow hidden sm:block" aria-hidden>
            {open ? "Close" : "Menu"}
          </span>
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      {/* Mobile sheet. Rendered in flow rather than portalled — the header is
          already the topmost stacking context on this page. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="lg:hidden fixed inset-x-0 top-(--header-h,64px) bottom-0 overflow-y-auto overscroll-contain bg-paper border-t border-hairline"
      >
        <nav aria-label="Primary (mobile)" className="shell py-8">
          {/* Grouped, with the first group headed "Start here". Six ungrouped
              links is a list; grouped, the sheet answers the question a
              first-time visitor actually has, which is not "what pages exist"
              but "which one do I press". */}
          <div className="flex flex-col gap-8 sm:grid sm:grid-cols-2 sm:gap-x-10">
            {NAV_GROUPS.map((group) => (
              <section key={group.heading}>
                <h2 className="eyebrow m-0">{group.heading}</h2>
                <ul className="mt-3 flex flex-col list-none m-0 p-0">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        onClick={closeMenu}
                        href={item.href}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className="block font-display text-step-2 py-2.5 no-underline border-b border-hairline aria-[current=page]:text-brand"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {/* Same reasoning as the desktop side: once signed in, say so and say
              as whom, and stop inviting someone to join what they have joined.
              There is no dropdown here — a sheet has the room to state it
              outright, which is better than hiding it behind a tap. */}
          {account ? (
            <div className="mt-8 border-t border-hairline pt-6">
              <p className="m-0 text-step--1 text-quiet">Signed in as</p>
              <p className="m-0 mt-1 break-all text-step-0 font-medium">
                {account.email ?? "your account"}
              </p>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  void signOut();
                }}
                className="mt-5 inline-flex w-full items-center justify-center border border-hairline px-6 py-4 text-step-0 font-medium rounded-control"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Cta
                href="/join"
                onClick={closeMenu}
                arrow={false}
                className="mt-8 w-full justify-center text-step-0"
              >
                Join us
              </Cta>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  handleAccountClick();
                }}
                className="mt-4 inline-flex w-full items-center justify-center border border-hairline px-6 py-4 text-step-0 font-medium rounded-control"
              >
                Sign in
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
