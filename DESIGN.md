# Design

## Theme

Light. The decisive argument is physical: most visitors are on a mid-range Android phone outdoors in Ghanaian daylight, where a dark interface is measurably harder to read. Reverence is carried by the oxblood fields, the photography, and the pacing — not by a dark surface.

The scene the palette is composed against: *a courtyard at dusk in Accra — heat coming off red laterite ground, people standing close under a strung bulb, cloth and brass catching the last light.* That warmth lives in the brand colour and the imagery. It deliberately does not live in the background, which is pure white.

## Color

Strategy: **Committed**. A single deep oxblood carries roughly 40% of the surface area across the site, in full-bleed drenched fields (hero, partnership, gathering invitations) alternating with white reading sections. Neutrals do not hedge it.

All values OKLCH. Contrast verified numerically, not estimated.

```css
--bg:      oklch(1.000 0.000 0);     /* #ffffff — pure, no hidden warmth */
--surface: oklch(0.968 0.005 20);    /* #f8f3f3 — bg pulled toward ink */
--ink:     oklch(0.200 0.018 20);    /* #1e1313 — 18.2:1 on bg */
--muted:   oklch(0.500 0.016 20);    /* #6c605f — 6.1:1 on bg */
--primary: oklch(0.380 0.145 12);    /* #7d092d — oxblood */
--accent:  oklch(0.520 0.115 252);   /* #316ba9 — printer's blue */
--chalk:   oklch(0.970 0.008 40);    /* #faf3f1 — text on oxblood, 9.9:1 */
```

Verified ratios: ink/bg 18.18 · muted/bg 6.05 · ink/surface 16.54 · chalk/primary 9.89 · white/primary 10.80 · primary/accent 1.96 · accent/bg 5.51.

Usage rules:
- **Primary (oxblood)** fills CTAs and drenched sections, and is also the **link and focus-ring colour**. Text on an oxblood fill is `--chalk` or pure white, never dark. At 10.8:1 on white it is a strong link colour, and using the brand rather than a separate hue keeps links reading as part of the page instead of as browser defaults.
- **Accent (printer's blue)** is reserved for **data visualisation only** — a second hue so adjacent chart series stay distinguishable. It is deliberately not used for links, focus rings, or UI chrome; a blue link on an oxblood page looks unstyled.
- Links are distinguished from buttons by underline and weight, not by hue.
- **No gradients on brand colour.** Flat fields only. A gradient here would land directly in the megachurch anti-reference.
- The pan-African red-gold-green palette is deliberately avoided; cultural specificity comes from photography, copy, and type.

## Typography

Two families, paired on a genuine contrast axis (humanist book serif against a newspaper grotesque), both served through `next/font/google` so they self-host at build time — no third-party font request on a metered connection.

- **Alegreya** — display and headings, including the italic emphasis the reference template uses. Chosen for its calligraphic, book-typography roots: it reads as set rather than styled. Explicitly not Playfair / Cormorant / Fraunces, which are the reflex picks for this category.
- **Schibsted Grotesk** — body, UI, and all admin surfaces. Sturdy and neutral without being Inter.

Rules:
- Display clamp ceiling 5.5rem; letter-spacing floor -0.03em.
- Body measure capped at 68ch.
- `text-wrap: balance` on h1–h3, `text-wrap: pretty` on prose.
- Italic is used for emphasis inside headings only — a brand device borrowed from the reference, not decoration sprinkled elsewhere.
- Modular scale at 1.28×.

## Motion

Motion is part of the build, not a layer applied afterward. Libraries: **Motion** for component and scroll-linked animation, **Lenis** for smooth scroll on desktop.

- Easing is exponential ease-out throughout. No bounce, no elastic, no spring overshoot.
- **Content is visible by default.** Reveals enhance an already-rendered state; nothing is gated behind a scroll trigger, so a headless render or a hidden tab never ships a blank section.
- Mobile is transform-and-opacity only, and Lenis is disabled below the desktop breakpoint — native scroll is faster and better on a low-end phone.
- Desktop gets the fuller treatment: scroll-linked image scale, staggered list entrances, sticky section transitions.
- `prefers-reduced-motion: reduce` collapses every animation to an instant state or a short crossfade, and disables Lenis entirely.
- Each reveal is chosen for what it reveals. A uniform fade-up applied to every section is the tell to avoid.

## Layout

- Fluid spacing via `clamp()`, varied deliberately: generous separation between narrative sections, tight grouping within them.
- Full-bleed photography with overlaid type for hero and gathering sections — the canonical image-led move, and correct here.
- Asymmetric compositions for narrative sections; symmetric only where the content is genuinely parallel.
- Semantic z-index scale: `--z-dropdown: 10; --z-sticky: 20; --z-backdrop: 30; --z-modal: 40; --z-toast: 50; --z-tooltip: 60`.
- Responsive grids use `repeat(auto-fit, minmax(280px, 1fr))` rather than breakpoint stacks where the content allows.

## Imagery

The brief is image-led; shipping without photography would be a bug. Real ministry photography is the goal and does not exist yet — until it is supplied, the site uses verified Unsplash sources, clearly marked in code so they are easy to find and swap.

Search for the physical thing, not the category: "hands on a worn drum skin at dusk", "a crowded room lit by one window", "red laterite road after rain" — not "African worship".

Alt text carries the voice and describes the specific scene.

## Admin console

The admin is the **product** register and follows different rules: shadcn/ui components, `--surface` backgrounds, denser spacing, minimal motion. It inherits the same tokens so the two surfaces read as one system, but it does not inherit the brand's drama. Oxblood appears there only on destructive and primary actions.
