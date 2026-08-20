import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CmsImage } from "@/components/cms-image";
import { ParallaxMedia } from "@/components/parallax-media";
import { Reveal } from "@/components/reveal";
import { SplitWords } from "@/components/split-words";
import { Scene, SceneStack } from "@/components/scroll-sections";
import { PLACEHOLDER_BY_SLUG } from "@/lib/placeholder-images";
import type { HomeSection } from "@/lib/db/queries/public";

type SceneData = { lead?: string; linkHref?: string };

// Cycles the three tones/image treatments the reference design uses, however
// many scenes an admin ends up adding — this is presentation, not content.
const TONES = ["bg-brand-bg", "bg-surface", "on-brand"];

/**
 * Each holds the viewport while the next slides up over it. Every scene needs
 * an opaque ground or the one beneath shows through — and each gets its own
 * visual world, which is a permission the brand register grants and the
 * product register would not.
 */
export function SceneSection({ sections }: { sections: HomeSection[] }) {
  return (
    <SceneStack>
      {sections.map((section, i) => {
        const data = (section.data ?? {}) as SceneData;
        const tone = TONES[i % TONES.length];

        return (
          <Scene key={section.id} className={tone}>
            <div className="shell grid w-full gap-8 py-20 md:grid-cols-[1fr_0.85fr] md:items-center md:gap-16">
              <div>
                {section.title && (
                  <h2 className="m-0 text-step-4 max-w-[12ch]">
                    <SplitWords text={section.title} />
                  </h2>
                )}
                {/* Staggered behind the heading's own word reveal, so the
                    block resolves as one gesture rather than four. */}
                {data.lead && (
                  <Reveal from="below" delay={0.14} distance={14}>
                    <p
                      className={`m-0 mt-5 text-step-1 ${
                        tone === "on-brand" ? "quiet-text" : "text-quiet"
                      }`}
                    >
                      {data.lead}
                    </p>
                  </Reveal>
                )}
                {section.body && (
                  <Reveal from="below" delay={0.22} distance={14}>
                    <p className="measure m-0 mt-4">{section.body}</p>
                  </Reveal>
                )}
                {data.linkHref && section.title && (
                  <Reveal from="below" delay={0.3} distance={14}>
                    <Link
                      href={data.linkHref}
                      className={`mt-8 inline-flex items-center gap-2 underline underline-offset-4 ${
                        tone === "on-brand"
                          ? "text-chalk decoration-chalk/40 hover:decoration-chalk"
                          : "text-brand decoration-transparent hover:decoration-current"
                      }`}
                    >
                      More on {section.title.toLowerCase()}
                      <ArrowRight size={15} aria-hidden />
                    </Link>
                  </Reveal>
                )}
              </div>

              {/* Now shown on mobile too. The scroll-linked drift is pure
                  transform on a composited layer, so it costs a phone nothing
                  and it is most of what makes the section feel built. */}
              <ParallaxMedia className="m-0 aspect-4/5 rounded-(--radius)" drift={5} scaleFrom={1.08}>
                <CmsImage
                  media={section.media}
                  alt={section.media?.altText ?? section.title ?? ""}
                  fallback={PLACEHOLDER_BY_SLUG[section.slug]}
                  seed={3 + i * 8}
                  tone={i % TONES.length === 2 ? "soft" : "deep"}
                  sizes="(min-width: 768px) 40vw, 100vw"
                />
              </ParallaxMedia>
            </div>
          </Scene>
        );
      })}
    </SceneStack>
  );
}
