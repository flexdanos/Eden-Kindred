import type { Metadata } from "next";
import { CmsImage } from "@/components/cms-image";
import { Cta } from "@/components/cta";
import { ParallaxMedia } from "@/components/parallax-media";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { safe } from "@/lib/db/safe";
import { getPublishedPeople } from "@/lib/db/queries/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The people",
  description:
    "Names and faces from the Eden Kindred worship community, so the room is not full of strangers on the day you walk in.",
};

/**
 * The public "who you would meet" page.
 *
 * Reads the editorial `people` table only — never `profiles`. The musicians'
 * area lives at /team, behind a login, and is not this page; linking the public
 * site to /team is how visitors used to end up at a sign-in screen.
 *
 * One query, for the same reason as /connect: the production db client runs a
 * single connection and every query on a page queues behind the last.
 */
export default async function PeoplePage() {
  const rows = await safe("public-people", () => getPublishedPeople(), []);

  return (
    <>
      <section className="section">
        <div className="shell">
          <span className="eyebrow">The people</span>
          <h1 className="m-0 mt-5 text-step-5 max-w-[16ch]">
            <SplitWords text="Who you would actually *meet*" />
          </h1>
          <Reveal from="below" delay={0.35}>
            <p className="measure mt-8 text-step-1 text-quiet">
              A few of the people you are likely to run into on your first evening. Put a
              name to a face now, and the room is not a room full of strangers when you
              walk in.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section border-t border-hairline">
        <div className="shell">
          {rows.length === 0 ? (
            <Reveal from="below">
              <div className="card-soft max-w-2xl p-8">
                <h2 className="m-0 text-step-2">Faces are on their way</h2>
                <p className="m-0 mt-3 text-quiet">
                  We only put someone here once they have said yes, so this page fills
                  up slowly. In the meantime, the easiest way to meet people is simply to
                  turn up — someone will say hello.
                </p>
                <Cta href="/join" variant="quiet" className="mt-6">
                  What happens when you arrive
                </Cta>
              </div>
            </Reveal>
          ) : (
            <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((person, i) => (
                <li key={person.id}>
                  <Reveal from="below" delay={(i % 3) * 0.07}>
                    <article className="card-soft flex h-full flex-col overflow-hidden">
                      <ParallaxMedia className="aspect-4/5 w-full" drift={4} scaleFrom={1.06}>
                        <CmsImage
                          media={person.media}
                          alt={person.name}
                          seed={i * 13 + 7}
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                        />
                      </ParallaxMedia>
                      <div className="flex flex-1 flex-col p-7">
                        {person.role && <span className="eyebrow">{person.role}</span>}
                        <h2 className="m-0 mt-3 text-step-1">{person.name}</h2>
                        {person.bio && <p className="m-0 mt-3 text-quiet">{person.bio}</p>}
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="on-brand section">
        <div className="shell">
          <h2 className="m-0 text-step-4 max-w-[17ch]">
            <SplitWords text="Easier to meet them in *person*" />
          </h2>
          <p className="measure mt-6 text-step-1 quiet-text">
            Nobody will expect you to remember a name. Come to a program, sit wherever you
            like, and let the introductions happen on their own.
          </p>
          <div className="mt-(--space-block) flex flex-wrap gap-3">
            <Cta href="/join" variant="inverse">
              Come to a program
            </Cta>
            <Cta href="/connect" variant="inverse-outline" arrow={false}>
              Other ways in
            </Cta>
          </div>
        </div>
      </section>
    </>
  );
}
