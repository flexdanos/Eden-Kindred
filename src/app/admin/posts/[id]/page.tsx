import { notFound } from "next/navigation";
import { assertStaff } from "@/lib/auth/guard";
import { getPostById, listMediaAssets } from "@/lib/db/queries/admin-lists";
import { safe } from "@/lib/db/safe";
import { BackLink, PostEditor } from "./post-editor";

export const dynamic = "force-dynamic";

export default async function PostEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertStaff();
  const { id } = await params;

  const isNew = id === "new";
  const [post, assets] = await Promise.all([
    isNew ? null : safe("admin-post", () => getPostById(id), null),
    safe("admin-media", () => listMediaAssets(), []),
  ]);

  if (!isNew && !post) notFound();

  return (
    <div className="max-w-5xl">
      <BackLink />
      <h1 className="m-0 mt-3 mb-6 text-2xl font-semibold tracking-tight">
        {isNew ? "New post" : post!.title}
      </h1>
      <PostEditor
        post={
          post
            ? {
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                body: post.body,
                coverMediaId: post.coverMediaId,
                isPublished: post.isPublished,
              }
            : null
        }
        assets={assets}
      />
    </div>
  );
}
