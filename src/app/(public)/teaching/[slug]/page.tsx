import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { ParallaxMedia } from "@/components/parallax-media";
import { safe } from "@/lib/db/safe";
import { getPostBySlug } from "@/lib/db/queries/public";

export const revalidate = 300;

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Accra",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await safe("post-meta", () => getPostBySlug(slug), null);

  if (!post) return { title: "Not found" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: { type: "article", title: post.title, description: post.excerpt ?? undefined },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await safe("post", () => getPostBySlug(slug), null);

  if (!post) notFound();

  return (
    <article>
      <section className="section">
        <div className="shell">
          <Link
            href="/teaching"
            className="inline-flex items-center gap-2 text-step--1 text-quiet no-underline hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} aria-hidden />
            All teaching
          </Link>

          <h1 className="m-0 mt-6 text-step-4 max-w-[22ch]">
            <SplitWords text={post.title} />
          </h1>

          <Reveal from="below" delay={0.3}>
            {post.publishedAt && (
              <time
                dateTime={post.publishedAt.toISOString()}
                className="mt-6 block text-step--1 text-quiet tabular-nums"
              >
                {dateFmt.format(post.publishedAt)}
              </time>
            )}
            {post.excerpt && (
              <p className="measure mt-5 text-step-1 text-quiet">{post.excerpt}</p>
            )}
          </Reveal>
        </div>
      </section>

      {post.media && (
        <section className="shell">
          <ParallaxMedia
            className="w-full aspect-16/9 rounded-(--radius)"
            drift={6}
            scaleFrom={1.08}
          >
            <CmsImage
              media={post.media}
              alt={post.media.altText ?? post.title}
              sizes="(min-width: 1280px) 78rem, 100vw"
              priority
            />
          </ParallaxMedia>
        </section>
      )}

      <section className="section">
        <div className="shell">
          <Prose text={post.body} className="text-step-0" />
        </div>
      </section>

      <section className="section bg-surface border-t border-hairline">
        <div className="shell">
          <h2 className="m-0 text-step-3 max-w-[18ch]">
            <SplitWords text="This is easier said *out loud*" />
          </h2>
          <p className="measure mt-5 text-quiet">
            Most of what is written here started as an argument in a room. If you want the
            room rather than the page, the gatherings are open.
          </p>
          <Link
            href="/gatherings"
            className="mt-8 inline-flex items-center bg-brand text-chalk px-7 py-4 font-medium no-underline rounded-(--radius) transition-colors hover:bg-brand-hover"
          >
            When we gather
          </Link>
        </div>
      </section>
    </article>
  );
}
