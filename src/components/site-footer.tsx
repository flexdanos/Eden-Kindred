import Link from "next/link";

const COLUMNS = [
  {
    heading: "Community",
    links: [
      { href: "/community", label: "Who we are" },
      { href: "/gatherings", label: "Gatherings" },
      { href: "/teaching", label: "Teaching" },
      { href: "/join", label: "Join us" },
    ],
  },
  {
    heading: "Partnership",
    links: [
      { href: "/partnership", label: "Become a partner" },
      { href: "/give", label: "Give once" },
      { href: "/partnership/accountability", label: "Where money goes" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-hairline bg-surface">
      <div className="shell py-(--space-block)">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-step-2 leading-tight m-0">
              Eden <em>Kindred</em>
            </p>
            <p className="measure mt-3 text-step--1 text-quiet">
              A community you belong to, not an audience you join.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="text-step--1 font-semibold m-0 mb-3">{col.heading}</h2>
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
            © {year} Eden Kindred. Accra, Ghana.
          </p>
          <p className="text-step--1 text-quiet m-0">
            Gifts are received in Ghana cedis (GHS) by mobile money.
          </p>
        </div>
      </div>
    </footer>
  );
}
