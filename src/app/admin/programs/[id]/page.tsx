import { notFound } from "next/navigation";
import { assertStaff } from "@/lib/auth/guard";
import { getProgramById, listMediaAssets, listProgramComments } from "@/lib/db/queries/admin-lists";
import { safe } from "@/lib/db/safe";
import { deleteProgramComment } from "@/app/admin/mutations";
import { BackLink, ProgramEditor } from "./program-editor";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function ProgramEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertStaff();
  const { id } = await params;

  const isNew = id === "new";
  const [event, assets, comments] = await Promise.all([
    isNew ? null : safe("admin-program", () => getProgramById(id), null),
    safe("admin-media", () => listMediaAssets(), []),
    isNew ? Promise.resolve([]) : safe("admin-program-comments", () => listProgramComments(id), []),
  ]);

  if (!isNew && !event) notFound();

  return (
    <div className="max-w-5xl">
      <BackLink />
      <h1 className="m-0 mt-3 mb-6 text-2xl font-semibold tracking-tight">
        {isNew ? "New program" : event!.title}
      </h1>
      <ProgramEditor
        event={
          event
            ? {
                id: event.id,
                title: event.title,
                slug: event.slug,
                description: event.description,
                location: event.location,
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                coverMediaId: event.coverMediaId,
                isPublished: event.isPublished,
                gallery: event.gallery,
              }
            : null
        }
        assets={assets}
      />

      {!isNew && (
        <section className="mt-10 max-w-2xl">
          <h2 className="m-0 mb-4 text-base font-semibold">Comments</h2>
          {comments.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <ul className="list-none m-0 p-0 border border-border">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-medium">
                      {comment.authorName}
                      <span className="ml-2 font-normal text-xs text-muted-foreground">
                        {dateFmt.format(comment.createdAt)}
                      </span>
                    </p>
                    <p className="m-0 mt-1 text-sm text-muted-foreground">{comment.body}</p>
                  </div>
                  <form action={deleteProgramComment}>
                    <input type="hidden" name="id" value={comment.id} />
                    <input type="hidden" name="eventId" value={id} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:bg-accent"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
