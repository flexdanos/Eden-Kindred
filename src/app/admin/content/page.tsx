import Link from "next/link";
import { Plus } from "lucide-react";
import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listContentBlocks } from "@/lib/db/queries/admin-lists";
import { PublishPill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

/**
 * Known slugs the public site reads. Listing them means an admin can see what
 * is missing, rather than having to guess the naming convention.
 */
const KNOWN_SLUGS = [
  { slug: "home-hero", where: "Home — the opening screen" },
  { slug: "home-belonging", where: "Home — the oxblood belonging section" },
];

export default async function ContentPage() {
  await assertStaff();
  const blocks = await safe("admin-content", () => listContentBlocks(), []);
  const present = new Set(blocks.map((b) => b.slug));
  const missing = KNOWN_SLUGS.filter((k) => !present.has(k.slug));

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">Page sections</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            Named blocks the public pages read by slug. Editing one changes the live site
            once it is published.
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors duration-150 hover:bg-[var(--brand-hover)]"
        >
          <Plus size={15} aria-hidden />
          New section
        </Link>
      </header>

      {missing.length > 0 && (
        <div className="mb-5 border border-border bg-muted/40 p-4">
          <h2 className="m-0 text-sm font-semibold">Not set yet</h2>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            These sections have designed fallbacks on the site, so nothing is broken — but
            they are showing default copy and generated artwork until you fill them in.
          </p>
          <ul className="mt-2.5 list-none m-0 p-0 flex flex-col gap-1">
            {missing.map((m) => (
              <li key={m.slug} className="text-sm">
                <Link
                  href={`/admin/content/new?slug=${m.slug}`}
                  className="underline underline-offset-2"
                >
                  {m.slug}
                </Link>
                <span className="text-muted-foreground"> — {m.where}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {blocks.length === 0 ? (
        <EmptyState
          title="No sections yet"
          body="The public site renders designed defaults for every section, so it looks complete before you write anything. Create a section to take control of one."
          action={{ href: "/admin/content/new", label: "Create a section" }}
        />
      ) : (
        <ul className="list-none m-0 p-0 border border-border">
          {blocks.map((block) => (
            <li key={block.id} className="border-b border-border last:border-0">
              <Link
                href={`/admin/content/${block.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 no-underline transition-colors duration-150 hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-sm">{block.slug}</span>
                  {block.title && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {block.title}
                    </span>
                  )}
                </span>
                <PublishPill published={block.isPublished} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
