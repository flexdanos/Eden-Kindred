# Product

## Register

brand

## Platform

web

## Users

Eden Kindred is a worldwide community, not a Ghanaian one with a diaspora attached. Ghana is where a lot of the giving infrastructure lives, and it shapes payments — it does not define the audience, and copy that assumes a single city is wrong.

The primary visitor is a newcomer — someone who has heard the community's name, or found it through a friend, a search, or the music, and is quietly deciding whether this is a place for them. They arrive uncommitted and slightly guarded. Many are on a mid-range Android phone on mobile data, often in bright daylight, and they will leave if the first screen is slow or asks for something before it has given anything. Designing for that visitor keeps the site fast for everyone else too.

The secondary visitor is an existing member returning for music, teaching, gathering times, and news. They need recency and speed over persuasion — they already believe, and the site should not re-sell them.

A third audience is the musicians. This is a music-led community, so the people who play are participants in the work rather than staff serving it. They get their own authenticated surface for charts, rehearsal material, and setlists.

Partners who fund the work are not a separate audience with a separate voice; they are newcomers and members who reached the point of giving. Partnership is the destination of the same journey, not a parallel track.

## Product Purpose

A public home for the Eden Kindred worship community that makes a stranger feel there is room for them, and gives an existing member somewhere real to return to. It carries the ministry's story, its gatherings, its teaching, and its partnership programme in one place.

Success is layered, and the layers are ordered. First, the ministry reads as established and serious to someone encountering it cold. Second, more people actually arrive — at gatherings, in the community, in the room. Third, a stable base of monthly partners forms, funded through mobile money. Campaign giving around specific appeals is a capability the site must support, not the spine it is built on.

## Positioning

A community you belong to, not an audience you join.

## Conversion & proof

- Primary CTA: join the community. Secondary: become a monthly partner.
- The line a visitor remembers after 10 seconds: there is room for you here, and people who will know your name.
- Belief ladder: this is real and established → these are people I recognise something in → there is a specific, low-cost way in → belonging here is worth sustaining → sustaining it is something I can do monthly.
- Proof on hand: none supplied yet. Photography, testimonies, and gathering records need to be collected into `.impeccable/assets/proof/` before launch. Until then the site ships with clearly-marked placeholder imagery.

## Brand Personality

Grounded, resonant, unhurried. The voice speaks plainly and does not perform warmth — it demonstrates it by being specific. It names places, times, and people rather than describing feelings. It never uses urgency as a persuasion device, and never asks before it has offered.

The visitor should feel rootedness and reverence first, warmth close behind, and energy only where energy is literally true — in the gathering and event material. Warmth is carried by photography, copy, and human specificity, not by a soft palette.

## Anti-references

- **Charity guilt appeal.** Sorrowful imagery, urgency banners, countdowns, "just ₵20 will…" framing. Explicitly ruled out by the client. Partnership is framed as participation, never as rescue.
- **Generic megachurch site.** Stock hands-in-the-air photography, blue-to-purple gradients, sans-serif everything, a looping hero video.
- **Corporate SaaS landing page.** Feature grids, three identical cards, gradient headings, big-number stat rows.
- **Editorial-typographic minimalism.** Display-serif-plus-mono-labels-plus-ruled-columns with no imagery. This is the second-order reflex for a brief that rejects the first two, and it is wrong here: this brand is image-led and colour-committed, not a magazine cover.
- **Pan-African flag palette.** Red-gold-green as a shorthand for Ghanaian identity. The cultural reading comes from typography, photography, and copy instead.

## Design Principles

**Give before asking.** Every page offers something — a time, a place, a message, a face — before it requests anything. The primary CTA is joining, not giving, and the layout must reflect that ordering.

**Specificity is the warmth.** Named people, real gathering times, actual photographs of actual rooms. Generic warmth reads as stock; particular detail reads as true.

**Fast on a cheap phone in the sun.** Mobile-first with progressive enhancement. The full scroll choreography is a desktop enhancement, never a prerequisite for the content. Images are budgeted; motion is transform-and-opacity on mobile.

**Partnership is participation.** Giving surfaces are calm, transparent, and specific about where money goes. No pressure mechanics, no shame, no manufactured deadlines.

**Consistency of voice over consistency of treatment.** Sections may have distinct visual worlds — a drenched oxblood partnership field beside a white editorial teaching section — provided the voice and typography hold steady across them.

## Accessibility & Inclusion

Target WCAG 2.2 AA. Body text at ≥4.5:1, large text at ≥3:1, verified rather than assumed. This is not a compliance exercise here — it is the same requirement as daylight readability on a mid-range phone, which is the realistic condition for most visitors.

Every animation needs a `prefers-reduced-motion` alternative, defaulting to a crossfade or an instant state. Content must never be gated behind a scroll-triggered reveal: sections render visible by default and animation enhances an already-visible state.

Amounts display in GHS with explicit currency, since diaspora visitors may assume otherwise. Gathering times display with an explicit timezone.
