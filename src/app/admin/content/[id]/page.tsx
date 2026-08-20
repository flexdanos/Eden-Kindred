import { notFound } from "next/navigation";
import { assertStaff } from "@/lib/auth/guard";
import { getContentBlockById, listMediaAssets } from "@/lib/db/queries/admin-lists";
import { safe } from "@/lib/db/safe";
import { BackLink, BlockEditor } from "./block-editor";

export const dynamic = "force-dynamic";

export default async function BlockEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slug?: string }>;
}) {
  await assertStaff();
  const [{ id }, { slug }] = await Promise.all([params, searchParams]);

  const isNew = id === "new";
  const [block, assets] = await Promise.all([
    isNew ? null : safe("admin-block", () => getContentBlockById(id), null),
    safe("admin-media", () => listMediaAssets(), []),
  ]);

  if (!isNew && !block) notFound();

  return (
    <div className="max-w-5xl">
      <BackLink />
      <h1 className="m-0 mt-3 mb-6 font-mono text-2xl font-semibold tracking-tight">
        {isNew ? (slug ?? "New section") : block!.slug}
      </h1>
      <BlockEditor
        block={
          block
            ? {
                id: block.id,
                slug: block.slug,
                kind: block.kind,
                sortOrder: block.sortOrder,
                title: block.title,
                body: block.body,
                data: block.data,
                mediaId: block.mediaId,
                isPublished: block.isPublished,
              }
            : null
        }
        defaultSlug={slug}
        assets={assets}
      />
    </div>
  );
}
