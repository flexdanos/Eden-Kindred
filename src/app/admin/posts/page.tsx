import Link from "next/link";
import { Plus } from "lucide-react";
import { assertStaff } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listPosts } from "@/lib/db/queries/admin-lists";
import { PublishPill } from "@/components/admin/status-pill";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});

export default async function PostsPage() {
  await assertStaff();
  const posts = await safe("admin-posts", () => listPosts(), []);

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">Teaching</h1>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            Posts and testimonies. Drafts stay invisible to the public site until you
            publish them.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground no-underline transition-colors duration-150 hover:bg-[var(--brand-hover)]"
        >
          <Plus size={15} aria-hidden />
          New post
        </Link>
      </header>

      {posts.length === 0 ? (
        <EmptyState
          title="Nothing written yet"
          body="Teaching posts appear on the public site newest first, and the three most recent are shown on the home page."
          action={{ href: "/admin/posts/new", label: "Write the first one" }}
        />
      ) : (
        <ul className="list-none m-0 p-0 border border-border">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-border last:border-0">
              <Link
                href={`/admin/posts/${post.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 no-underline transition-colors duration-150 hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{post.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    /teaching/{post.slug}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  {post.publishedAt ? dateFmt.format(post.publishedAt) : "—"}
                  <PublishPill published={post.isPublished} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
