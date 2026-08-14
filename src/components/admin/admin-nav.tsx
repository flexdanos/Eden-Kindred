"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Coins,
  Disc3,
  FileText,
  Music2,
  HandCoins,
  Image as ImageIcon,
  LayoutTemplate,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match the path exactly. Needed for /admin, which prefixes every child. */
  exact?: boolean;
};

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: BarChart3, exact: true }],
  },
  {
    label: "Giving",
    items: [
      { href: "/admin/donations", label: "Donations", icon: Coins },
      { href: "/admin/partners", label: "Partners", icon: Users },
      { href: "/admin/tiers", label: "Tiers", icon: HandCoins },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content", label: "Page sections", icon: LayoutTemplate },
      { href: "/admin/posts", label: "Teaching", icon: FileText },
      { href: "/admin/events", label: "Gatherings", icon: CalendarDays },
      { href: "/admin/releases", label: "Music", icon: Disc3 },
      { href: "/admin/media", label: "Media", icon: ImageIcon },
    ],
  },
  {
    label: "Team",
    items: [{ href: "/admin/team", label: "Musicians", icon: Music2 }],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  // Horizontal scroller on mobile, sidebar from md up. Stacking ten links
  // vertically above every admin page pushed the actual content off the first
  // screen — the nav was taller than the work.
  return (
    <nav
      aria-label="Admin"
      className="flex gap-3 overflow-x-auto md:overflow-visible md:flex-col md:gap-6"
    >
      {GROUPS.map((group) => (
        <div key={group.label} className="flex items-center gap-1 md:block">
          <h2 className="hidden md:block px-3 mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h2>
          <ul className="list-none m-0 p-0 flex gap-1 md:flex-col md:gap-0.5">
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    data-active={active}
                    className="flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm no-underline text-foreground/75 transition-colors duration-150 hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground data-[active=true]:font-medium"
                  >
                    <Icon size={15} aria-hidden className="shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
