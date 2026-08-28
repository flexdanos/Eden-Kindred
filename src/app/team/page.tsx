import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileMusic, ListMusic, NotebookPen, Volume2 } from "lucide-react";
import { assertTeamMember } from "@/lib/auth/guard";
import { safe } from "@/lib/db/safe";
import { listTeamResources } from "@/lib/db/queries/admin-lists";
import { publicStorageUrl } from "@/lib/storage";
import { Prose } from "@/components/prose";
import { EmptyState } from "@/components/admin/empty-state";

// Behind a login and specific to the person reading it — never cached, never
// indexed.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Musicians",
  robots: { index: false, follow: false },
};

const KIND = {
  chord_chart: { label: "Chord chart", icon: FileMusic },
  rehearsal_audio: { label: "Rehearsal audio", icon: Volume2 },
  setlist: { label: "Setlist", icon: ListMusic },
  note: { label: "Note", icon: NotebookPen },
} as const;

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function TeamPage() {
  const user = await assertTeamMember();
  const resources = await safe("team-resources", () => listTeamResources(), []);

  const upcoming = resources.filter((r) => r.eventStartsAt && r.eventStartsAt >= new Date());
  const general = resources.filter((r) => !r.eventStartsAt || r.eventStartsAt < new Date());

  return (
    <main className="flex-1">
      <section className="section">
        <div className="shell">
          <p className="m-0 text-step--1 uppercase tracking-wider text-quiet">Musicians</p>
          <h1 className="m-0 mt-3 text-step-4 max-w-[18ch]">
            Everything for the next <em>program</em>
          </h1>
          <p className="measure mt-5 text-quiet">
            Signed in as {user.fullName ?? user.email}
            {user.instrument ? ` · ${user.instrument}` : ""}. This page is not public and is
            not indexed.
          </p>
        </div>
      </section>

      {resources.length === 0 ? (
        <section className="shell pb-(--space-section)">
          <EmptyState
            title="Nothing here yet"
            body="Chord charts, rehearsal audio, and setlists appear here once someone adds them from the admin console."
          />
        </section>
      ) : (
        <>
          {upcoming.length > 0 && (
            <ResourceList
              heading="For what is coming up"
              resources={upcoming}
              showEvent
            />
          )}
          {general.length > 0 && (
            <ResourceList heading="Everything else" resources={general} showEvent={false} />
          )}
        </>
      )}
    </main>
  );
}

type Resource = Awaited<ReturnType<typeof listTeamResources>>[number];

function ResourceList({
  heading,
  resources,
  showEvent,
}: {
  heading: string;
  resources: Resource[];
  showEvent: boolean;
}) {
  return (
    <section className="section border-t border-hairline">
      <div className="shell">
        <h2 className="m-0 text-step-2">{heading}</h2>

        <ul className="mt-(--space-block) list-none m-0 p-0 border-t border-hairline">
          {resources.map((resource) => {
            const meta = KIND[resource.kind] ?? KIND.note;
            const Icon = meta.icon;
            const fileUrl =
              resource.mediaPath && resource.mediaBucket
                ? publicStorageUrl(resource.mediaBucket, resource.mediaPath)
                : null;

            return (
              <li key={resource.id} className="border-b border-hairline py-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Icon size={16} aria-hidden className="translate-y-0.5 text-quiet" />
                  <h3 className="m-0 text-step-1">{resource.title}</h3>
                  <span className="text-step--1 text-quiet">{meta.label}</span>
                  {showEvent && resource.eventTitle && (
                    <span className="text-step--1 text-quiet">
                      · {resource.eventTitle}
                      {resource.eventStartsAt &&
                        ` (${dateFmt.format(resource.eventStartsAt)})`}
                    </span>
                  )}
                </div>

                {resource.body && (
                  <Prose text={resource.body} className="mt-3 text-step--1 text-quiet" />
                )}

                <div className="mt-3 flex flex-wrap gap-3">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-hairline px-3 py-1.5 text-step--1 no-underline transition-colors hover:border-ink"
                    >
                      Open file
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  )}
                  {resource.externalUrl && (
                    <a
                      href={resource.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-hairline px-3 py-1.5 text-step--1 no-underline transition-colors hover:border-ink"
                    >
                      Open link
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          href="/"
          className="mt-8 inline-block text-step--1 text-quiet no-underline hover:text-ink"
        >
          ← Back to the site
        </Link>
      </div>
    </section>
  );
}
