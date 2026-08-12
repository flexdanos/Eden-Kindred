import { notFound } from "next/navigation";
import { assertStaff } from "@/lib/auth/guard";
import { getEventById, listMediaAssets } from "@/lib/db/queries/admin-lists";
import { safe } from "@/lib/db/safe";
import { BackLink, EventEditor } from "./event-editor";

export const dynamic = "force-dynamic";

export default async function EventEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertStaff();
  const { id } = await params;

  const isNew = id === "new";
  const [event, assets] = await Promise.all([
    isNew ? null : safe("admin-event", () => getEventById(id), null),
    safe("admin-media", () => listMediaAssets(), []),
  ]);

  if (!isNew && !event) notFound();

  return (
    <div className="max-w-5xl">
      <BackLink />
      <h1 className="m-0 mt-3 mb-6 text-2xl font-semibold tracking-tight">
        {isNew ? "New gathering" : event!.title}
      </h1>
      <EventEditor
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
              }
            : null
        }
        assets={assets}
      />
    </div>
  );
}
