# Design

## Theme

Light. The decisive argument is physical: most visitors are on a mid-range Android phone outdoors in Ghanaian daylight, where a dark interface is measurably harder to read. Reverence is carried by the oxblood fields, the photography, and the pacing — not by a dark surface.

The scene the palette is composed against: *a courtyard at dusk in Accra — heat coming off red laterite ground, people standing close under a strung bulb, cloth and brass catching the last light.* That warmth lives in the brand colour and the imagery. It deliberately does not live in the background, which is pure white.

## Color

Strategy: **Committed**. A single deep oxblood carries roughly 40% of the surface area across the site, in full-bleed drenched fields (hero, partnership, gathering invitations) alternating with white reading sections. Neutrals do not hedge it.

All values OKLCH. Contrast verified numerically, not estimated.

```css
--bg:      oklch(1.000 0.000 0);     /* #ffffff — cards, and the admin ground */
--paper:   oklch(0.975 0.006 45);    /* #faf6f3 — the public page ground */
--surface: oklch(0.968 0.005 20);    /* #f8f3f3 — bg pulled toward ink */
--ink:     oklch(0.200 0.018 20);    /* #1e1313 — 18.2:1 on bg */
--muted:   oklch(0.500 0.016 20);    /* #6c605f — 6.1:1 on bg */
--primary: oklch(0.380 0.145 12);    /* #7d092d — oxblood */
--accent:  oklch(0.520 0.115 252);   /* #316ba9 — printer's blue */
--chalk:   oklch(0.970 0.008 40);    /* #faf3f1 — text on oxblood, 9.9:1 */
```

Verified ratios: ink/bg 18.18 · muted/bg 6.05 · ink/paper 16.89 · muted/paper 5.62 · ink/surface 16.54 · chalk/primary 9.89 · white/primary 10.80 · primary/accent 1.96 · accent/bg 5.51.

**Paper, and why the "pure white" rule moved.** The public site's ground is
`--paper`, not `--bg`. The original argument for pure white was daylight
readability on a mid-range phone, and that argument is about light versus dark
— at L 0.975 paper is functionally identical outdoors, and the measured ratios
above say so rather than assuming it. What it buys is separation: on a white
ground the only way to make a panel read as a panel is a border or a shadow,
and this brand will not use shadows. On paper, a white card is simply lighter
than the page. The admin console stays on `--bg`; a dense table gains nothing
from a warm ground.

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

- Easing is exponential ease-out for fades and scroll-linked motion. Entrances and interactive feedback may use a **soft spring** with a small overshoot: scroll reveals (`Reveal`, `RevealItem`), link-card hover lift (`.card-bounce`), and the hero mark's pop-in. Keep overshoot gentle (Motion `bounce` ≤ 0.4, CSS `--ease-spring`); no elastic wobble.
- Ambient loops are allowed where they are decorative and transform-only: the hero photograph's slow zoom (`animate-kenburns`), the hero mark's float (`animate-float`), and auto-sliding card rows (`AutoSlider`, which pauses on hover and focus).
- **Content is visible by default.** Reveals enhance an already-rendered state; nothing is gated behind a scroll trigger, so a headless render or a hidden tab never ships a blank section.
- Mobile is transform-and-opacity only, and Lenis is disabled below the desktop breakpoint — native scroll is faster and better on a low-end phone.
- Desktop gets the fuller treatment: scroll-linked image scale, staggered list entrances, sticky section transitions.
- `prefers-reduced-motion: reduce` collapses every animation to an instant state or a short crossfade, and disables Lenis entirely.
- Each reveal is chosen for what it reveals. A uniform fade-up applied to every section is the tell to avoid.

## Layout

### Radii

Three values, because they answer three different questions:

| token | value | used for |
| --- | --- | --- |
| `--radius` | 3px | admin console, and anything behaving like a form control in a dense table |
| `--control-radius` | 8px | public-site buttons and inputs (`rounded-control`) |
| `--card-radius` | 14px | photographs, cards, panels (`rounded-card`, `.frame`, `.card-soft`) |

"Set, not styled" still governs the admin. It was wrong about photography: a
3px corner on a 4:3 photograph doesn't read as restraint, it reads as an
unstyled `<img>`. Controls sit between the two — enough arc to belong beside a
14px card, not enough to become a pill, which is the megachurch tell.

`.card-soft` carries no shadow. Against `--paper`, the value step from a white
fill already separates the planes, and a shadow under every card is the SaaS
landing page PRODUCT.md rules out.

### Next-step rows

The pattern for offering a visitor somewhere to go: a photograph, a short
paragraph, and **exactly one** link out, alternating side by index
(`src/components/next-step.tsx`). The constraint is the point — a reader
scrolling a stack of these is never asked to compare options, only to continue
or stop, which suits a newcomer who arrives guarded. Cap a list at five or six;
past that the page stops being a path and becomes a directory. Where options
genuinely are parallel, use `NextStepCard` in a grid instead, and be honest
about which of the two a section needs.

Order rows by what each one costs the reader, cheapest first. On `/connect`
that runs: listen → read → attend → join a group → give.

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
