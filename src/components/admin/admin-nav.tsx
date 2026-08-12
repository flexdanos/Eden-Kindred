"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Coins,
  FileText,
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
      { href: "/admin/media", label: "Media", icon: ImageIcon },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-6 md:flex-col">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <h2 className="px-3 mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h2>
          <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
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
                    className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm no-underline text-foreground/75 transition-colors duration-150 hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground data-[active=true]:font-medium"
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
