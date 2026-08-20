import Link from "next/link";
import { Plus } from "lucide-react";
import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listContentBlocks } from "@/lib/db/queries/admin-lists";
import { deleteContentBlock } from "@/app/admin/mutations";
import { PublishPill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";
import { CONTENT_BLOCK_KIND_INFO } from "@/lib/content-block-kinds";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  await assertStaff();
  const blocks = await safe("admin-content", () => listContentBlocks(), []);

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">Page sections</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            The homepage renders every published section below, in the order shown. Add,
            reorder, or remove one and the live site follows once it&apos;s published.
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

      {blocks.length === 0 ? (
        <EmptyState
          title="No sections yet"
          body="The homepage has nothing to show until at least one section is created here."
          action={{ href: "/admin/content/new", label: "Create a section" }}
        />
      ) : (
        <ul className="list-none m-0 p-0 border border-border">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <Link
                href={`/admin/content/${block.id}`}
                className="min-w-0 flex-1 no-underline hover:opacity-80"
              >
                <span className="flex items-center gap-2">
                  <span className="truncate font-mono text-sm">{block.slug}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {CONTENT_BLOCK_KIND_INFO[block.kind].label}
                  </span>
                </span>
                {block.title && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {block.title}
                  </span>
                )}
              </Link>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted-foreground">order {block.sortOrder}</span>
                <PublishPill published={block.isPublished} />
                <form action={deleteContentBlock}>
                  <input type="hidden" name="id" value={block.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-accent"
                  >
                    Delete
                  </button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
