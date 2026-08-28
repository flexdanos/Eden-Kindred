import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { safe } from "@/lib/db/safe";
import { getPublishedPosts } from "@/lib/db/queries/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Teaching",
  description:
    "Writing and teaching from the Eden Kindred worship community — worked through slowly, with room to disagree.",
};

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Accra",
});

export default async function TeachingPage() {
  const posts = await safe("teaching-list", () => getPublishedPosts(50), []);

  return (
    <>
      <section className="section">
        <div className="shell">
          <h1 className="m-0 text-step-5 max-w-[14ch]">
            <SplitWords text="Worked through *slowly*" />
          </h1>
          <Reveal from="below" delay={0.3}>
            <p className="measure mt-8 text-step-1 text-quiet">
              Writing from the programs and around them. None of it is the last word on
              anything; that is rather the point.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell">
          {posts.length > 0 ? (
            <ul className="list-none m-0 p-0 border-t border-hairline">
              {posts.map((post, i) => (
                <li key={post.slug} className="border-b border-hairline">
                  <Reveal from="below" delay={Math.min(i, 6) * 0.05}>
                    <Link
                      href={`/teaching/${post.slug}`}
                      className="group grid gap-2 py-8 no-underline md:grid-cols-[0.85fr_1.15fr] md:gap-8"
                    >
                      <div>
                        <h2 className="m-0 text-step-2 transition-colors group-hover:text-brand">
                          {post.title}
                        </h2>
                        {post.publishedAt && (
                          <time
                            dateTime={post.publishedAt.toISOString()}
                            className="mt-2 block text-step--1 text-quiet tabular-nums"
                          >
                            {dateFmt.format(post.publishedAt)}
                          </time>
                        )}
                      </div>
                      {post.excerpt && (
                        <p className="measure m-0 text-quiet">{post.excerpt}</p>
                      )}
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <p className="measure text-quiet">
              Nothing published yet. Teaching appears here as it is written.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
