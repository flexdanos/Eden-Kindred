/**
 * Stand-in photography, until real ministry pictures are uploaded at
 * /admin/media.
 *
 * Every URL here was fetched and visually checked before being added — not
 * guessed. Guessed Unsplash ids look plausible and 404 in production.
 *
 * WHY THESE ARE ALL DETAIL SHOTS, never congregations:
 *
 * Two dozen "worship" and "church" stock photos were reviewed and almost all
 * were unusable — American auditoriums with stage lighting and raised hands
 * (the exact megachurch look PRODUCT.md rules out), European parishes, Gothic
 * rose windows, or congregations in COVID masks that date the picture.
 *
 * Beyond taste, there is an honesty problem: a photograph of a crowd, placed
 * on this site, silently claims to be *this* congregation. It isn't. Hands on
 * a drum or a keyboard carry the same warmth, are recognisably West African,
 * and claim nothing untrue. That is why the set looks like this.
 *
 * Replace them with real photographs as soon as there are any. The moment a
 * CMS image is set for a section, the stand-in disappears.
 */

export type PlaceholderImage = {
  url: string;
  /** Describes the scene, and never implies it depicts Eden Kindred. */
  alt: string;
  /** Unsplash photo id, for looking up the photographer to credit. */
  unsplashId: string;
};

const cdn = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

/**
 * Three images, each used exactly once.
 *
 * There are five image slots on the home page. Rather than repeat a photograph
 * twice on a single scroll — which reads as thin far more than an abstract
 * field does — the remaining slots fall through to the generated brand field.
 * Add entries here as more verified photographs are found, or let real uploads
 * take the slots.
 */
export const PLACEHOLDER: Record<"hero" | "worship" | "teaching", PlaceholderImage> = {
  hero: {
    url: cdn("1551752480-6ecf175fcd51"),
    alt: "Two hands resting on the worn skin of a djembe, wax-print cloth behind them",
    unsplashId: "1551752480-6ecf175fcd51",
  },
  worship: {
    url: cdn("1537930385926-b88db6f104a1"),
    alt: "A drummer in a patterned shirt, mid-beat, hands open above the drum head",
    unsplashId: "1537930385926-b88db6f104a1",
  },
  teaching: {
    url: cdn("1673062187663-26bf343b1a79"),
    alt: "Hands spread across the keys of an electric piano in low light",
    unsplashId: "1673062187663-26bf343b1a79",
  },
};

/**
 * Same three stand-ins, keyed by the homepage section slug that uses them
 * instead of a fixed JSX call site — the homepage now renders an admin-
 * editable list of sections rather than fixed markup, so a section's fallback
 * image has to be looked up by its (also admin-assigned) slug. A section with
 * no entry here falls through to CmsImage's generated brand field, same as
 * any slug an admin adds later.
 */
export const PLACEHOLDER_BY_SLUG: Record<string, PlaceholderImage> = {
  "home-hero": PLACEHOLDER.hero,
  "home-scene-worship": PLACEHOLDER.worship,
  "home-scene-teaching": PLACEHOLDER.teaching,
};
