import { CtaSection } from "@/components/home-sections/cta-section";
import { GatheringPreviewSection } from "@/components/home-sections/gathering-preview-section";
import { HeroSection } from "@/components/home-sections/hero-section";
import { PinnedSection } from "@/components/home-sections/pinned-section";
import { SceneSection } from "@/components/home-sections/scene-section";
import { TeachingListSection } from "@/components/home-sections/teaching-list-section";
import { safe } from "@/lib/db/safe";
import { getHomeSections, getPublishedPosts, getUpcomingEvents } from "@/lib/db/queries/public";

export const revalidate = 300;

/**
 * The whole homepage is an ordered, admin-editable list of sections
 * (/admin/content) — nothing here is hardcoded copy or imagery. A section
 * with no published row simply doesn't render; there is no per-section
 * designed-copy fallback to fall back to.
 */
export default async function HomePage() {
  const [sections, events, posts] = await Promise.all([
    safe("home-sections", () => getHomeSections(), []),
    safe("upcoming-events", () => getUpcomingEvents(3), []),
    safe("recent-posts", () => getPublishedPosts(3), []),
  ]);

  const sceneSections = sections.filter((s) => s.kind === "scene");
  const firstSceneIndex = sections.findIndex((s) => s.kind === "scene");

  return (
    <>
      {sections.map((section, index) => {
        switch (section.kind) {
          case "hero":
            return <HeroSection key={section.id} section={section} />;
          case "gathering_preview":
            return (
              <GatheringPreviewSection key={section.id} section={section} events={events} />
            );
          case "scene":
            // All scene-kind sections stack together inside one SceneStack,
            // wherever the first of them falls in sort order.
            return index === firstSceneIndex ? (
              <SceneSection key="scenes" sections={sceneSections} />
            ) : null;
          case "pinned":
            return <PinnedSection key={section.id} section={section} />;
          case "teaching_list":
            return <TeachingListSection key={section.id} section={section} posts={posts} />;
          case "cta":
            return <CtaSection key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </>
  );
}
