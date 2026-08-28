import Link from "next/link";
import { RevealItem, RevealList } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import type { HomeSection, getPublishedPosts } from "@/lib/db/queries/public";

type TeachingListData = { linkLabel?: string; linkHref?: string };

const postDate = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Accra",
});

export function TeachingListSection({
  section,
  posts,
}: {
  section: HomeSection;
  posts: Awaited<ReturnType<typeof getPublishedPosts>>;
}) {
  if (posts.length === 0) return null;

  const data = (section.data ?? {}) as TeachingListData;

  return (
    <section className="section">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {section.title && (
            <h2 className="m-0 text-step-3">
              <SplitWords text={section.title} />
            </h2>
          )}
          {data.linkLabel && data.linkHref && (
            <Link href={data.linkHref} className="text-brand no-underline hover:underline">
              {data.linkLabel}
            </Link>
          )}
        </div>

        <RevealList className="mt-(--space-block) list-none p-0 m-0 border-t border-hairline">
          {posts.map((post) => (
            <RevealItem key={post.slug} className="border-b border-hairline">
              <Link
                href={`/teaching/${post.slug}`}
                className="group grid gap-2 py-7 no-underline md:grid-cols-[0.85fr_1.15fr] md:gap-8"
              >
                <h3 className="m-0 text-step-2 transition-colors group-hover:text-brand">
                  {post.title}
                </h3>
                <div>
                  {post.excerpt && <p className="measure m-0 text-quiet">{post.excerpt}</p>}
                  {post.publishedAt && (
                    <time
                      dateTime={post.publishedAt.toISOString()}
                      className="mt-3 block text-step--1 text-quiet"
                    >
                      {postDate.format(post.publishedAt)}
                    </time>
                  )}
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  );
}
