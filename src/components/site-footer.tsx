import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Four columns, grouped the same way the header sheet groups them, so a
 * visitor who scrolled past the nav meets the same map at the bottom.
 *
 * THIS COMPONENT DOES NOT TOUCH THE DATABASE, and that is a hard rule rather
 * than an accident of what it currently renders.
 *
 * The reference site puts its address, service times and email in the footer
 * of every page, which is genuinely useful, and the first version of this file
 * copied that by reading them from site settings. It made SiteFooter async —
 * and SiteFooter is in the public layout, so that added one query to the
 * render of every public page. Static generation then timed out on five routes
 * at once, because the pooler is answering a query per page for a block that
 * is identical on all of them.
 *
 * Contact details live on /connect instead, which is the page someone looks at
 * when they want to reach us and is already making a database call of its own.
 * If this footer ever does need live data, cache it — do not just add an await
 * here.
 */

const COLUMNS = [
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
      { href: "/people", label: "The people" },
      { href: "/programs", label: "Programs" },
      { href: "/teaching", label: "Teaching" },
    ],
  },
  {
    heading: "Partnership",
    links: [
      { href: "/partnership", label: "Become a partner" },
      { href: "/give", label: "Give once" },
      { href: "/partnership#accountability", label: "Where money goes" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-hairline bg-surface">
      <div className="shell py-(--space-block)">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo className="h-14" />
            <p className="measure mt-3 text-step--1 text-quiet">
              A community you belong to, not an audience you join.
            </p>
            <Link
              href="/connect"
              className="mt-5 inline-block text-step--1 text-quiet underline underline-offset-4 hover:text-ink transition-colors"
            >
              The next gathering, and ways in
            </Link>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="eyebrow m-0 mb-4">{col.heading}</h2>
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-step--1 text-quiet hover:text-ink transition-colors no-underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-hairline flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-step--1 text-quiet m-0">
            © {year} Eden Kindred. A worship community, wherever you are.
          </p>
          <p className="text-step--1 text-quiet m-0">
            Mobile money in cedis, or bank transfer, Zelle and Cash App from abroad.
          </p>
        </div>
      </div>
    </footer>
  );
}
