/**
 * The set of homepage section templates, plus the plain `standalone` block
 * kind that predates them (single title/body/image, read by slug — e.g. the
 * community page's intro). Shared between the admin editor (client) and the
 * save action (server), so the two never drift on what a kind's `data` shape
 * is meant to hold.
 */
export const CONTENT_BLOCK_KINDS = [
  "standalone",
  "hero",
  "scene",
  "pinned",
  "cta",
  "gathering_preview",
  "teaching_list",
] as const;

export type ContentBlockKind = (typeof CONTENT_BLOCK_KINDS)[number];

export const CONTENT_BLOCK_KIND_INFO: Record<
  ContentBlockKind,
  { label: string; description: string }
> = {
  standalone: {
    label: "Standalone",
    description:
      "A single title/body/image block read by slug — not part of the homepage's ordered sections.",
  },
  hero: {
    label: "Hero",
    description: "Full-bleed opening banner with a heading, body, and two buttons.",
  },
  scene: {
    label: "Scene",
    description:
      "A full-screen stacked scene: a short lead line, a heading, body text, an image, and one link.",
  },
  pinned: {
    label: "Pinned, two panels",
    description: "One held image with two text panels that scroll past it.",
  },
  cta: {
    label: "Call to action",
    description:
      "A heading and body next to a highlighted sub-card with its own heading, body, and two buttons.",
  },
  gathering_preview: {
    label: "Next gathering preview",
    description:
      "A heading plus the soonest upcoming, published gathering — or empty-state copy when none is scheduled.",
  },
  teaching_list: {
    label: "Recent teaching list",
    description: "A heading plus the most recently published posts.",
  },
};

/** Which flat form fields get folded into the row's `data` jsonb column, by kind. */
export const CONTENT_BLOCK_DATA_FIELDS: Record<ContentBlockKind, readonly string[]> = {
  standalone: [],
  hero: ["primaryLabel", "primaryHref", "secondaryLabel", "secondaryHref"],
  scene: ["lead", "linkHref"],
  pinned: ["secondaryTitle", "secondaryBody", "linkLabel", "linkHref"],
  cta: [
    "primaryLabel",
    "primaryHref",
    "secondaryLabel",
    "secondaryHref",
    "secondaryTitle",
    "secondaryBody",
  ],
  gathering_preview: ["emptyTitle", "emptyBody", "linkLabel"],
  teaching_list: ["linkLabel", "linkHref", "limit"],
};
