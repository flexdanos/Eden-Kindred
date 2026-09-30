import { notFound } from "next/navigation";
import { assertStaff } from "@/lib/auth/guard";
import { getPersonById, listMediaAssets } from "@/lib/db/queries/admin-lists";
import { safe } from "@/lib/db/safe";
import { deletePerson } from "@/app/admin/mutations";
import { BackLink, PersonEditor } from "./person-editor";

export const dynamic = "force-dynamic";

export default async function PersonEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await assertStaff();
  const { id } = await params;

  const isNew = id === "new";
  const [person, assets] = await Promise.all([
    isNew ? null : safe("admin-person", () => getPersonById(id), null),
    safe("admin-media", () => listMediaAssets(), []),
  ]);

  if (!isNew && !person) notFound();

  return (
    <div className="max-w-5xl">
      <BackLink />
      <h1 className="m-0 mt-3 mb-6 text-2xl font-semibold tracking-tight">
        {isNew ? "Add a person" : person!.name}
      </h1>
      <PersonEditor
        person={
          person
            ? {
                id: person.id,
                name: person.name,
                role: person.role,
                bio: person.bio,
                photoMediaId: person.photoMediaId,
                sortOrder: person.sortOrder,
                isPublished: person.isPublished,
              }
            : null
        }
        assets={assets}
      />

      {person && user.role === "admin" && (
        <form action={deletePerson} className="mt-10 max-w-2xl border-t border-border pt-5">
          <input type="hidden" name="id" value={person.id} />
          <p className="m-0 mb-3 text-sm text-muted-foreground">
            If they have asked to come off the site, remove them rather than
            unpublishing, so their details do not stay on file.
          </p>
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-accent"
          >
            Remove {person.name}
          </button>
        </form>
      )}
    </div>
  );
}
