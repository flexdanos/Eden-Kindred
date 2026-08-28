-- ============================================================================
-- Seed: homepage sections — Eden Kindred
-- Run AFTER the migration adding content_blocks.kind/sort_order has been
-- applied (npm run db:migrate), via:
--   node scripts/apply-sql.mjs supabase/seed-home-sections.sql
--
-- Carries the copy that used to be hardcoded in src/app/(public)/page.tsx
-- into content_blocks, so a fresh database still renders the designed
-- homepage instead of an empty one.
--
-- Idempotent, and deliberately narrow on conflict: re-running this only ever
-- touches `kind`, `sort_order`, and `data` on a row that already exists —
-- never its title/body/media/is_published — so it is always safe to re-run
-- even after an admin has since edited home-hero or home-belonging (the two
-- slugs that predate this feature and may already carry real title/body
-- content). `data` is included in the backfill because it was reserved-but-
-- unused before this feature: no admin edit could ever have set it through
-- the old editor, so there is nothing of theirs to lose by backfilling it.
-- ============================================================================

insert into content_blocks (slug, kind, sort_order, title, body, data, is_published, published_at)
values (
  'home-hero', 'hero', 10,
  'A community you *belong* to.',
  'Not an audience you join. We gather to worship, to learn, and to know each other by name.',
  '{"primaryLabel":"Join the community","primaryHref":"/join","secondaryLabel":"Partner with us","secondaryHref":"/partnership"}'::jsonb,
  true, now()
)
on conflict (slug) do update set kind = excluded.kind, sort_order = excluded.sort_order, data = excluded.data;

insert into content_blocks (slug, kind, sort_order, title, body, data, is_published, published_at)
values (
  'home-gathering-preview', 'gathering_preview', 20,
  'The next time we *gather*',
  null,
  '{"emptyTitle":"Gatherings are being scheduled.","emptyBody":"Dates and locations appear here as soon as they are published from the admin console.","linkLabel":"What to expect"}'::jsonb,
  true, now()
)
on conflict (slug) do update set kind = excluded.kind, sort_order = excluded.sort_order, data = excluded.data;

insert into content_blocks (slug, kind, sort_order, title, body, data, is_published, published_at)
values (
  'home-scene-worship', 'scene', 30,
  'Worship',
  'The gathering is the practice, not the warm-up to one. If you are new, this is the part where you can simply stand and listen. Nobody is counting.',
  '{"lead":"Sung and spoken, unhurried.","linkHref":"/programs"}'::jsonb,
  true, now()
)
on conflict (slug) do update set kind = excluded.kind, sort_order = excluded.sort_order, data = excluded.data;

insert into content_blocks (slug, kind, sort_order, title, body, data, is_published, published_at)
values (
  'home-scene-teaching', 'scene', 40,
  'Teaching',
  'We work through scripture together with room to disagree in the room rather than in the car afterwards. Questions are not an interruption of the thing; they are the thing.',
  '{"lead":"Slowly, and out loud.","linkHref":"/teaching"}'::jsonb,
  true, now()
)
on conflict (slug) do update set kind = excluded.kind, sort_order = excluded.sort_order, data = excluded.data;

insert into content_blocks (slug, kind, sort_order, title, body, data, is_published, published_at)
values (
  'home-scene-kinship', 'scene', 50,
  'Kinship',
  'Where people know your name, your work, and what you are carrying this month. This is where belonging stops being a word on a website.',
  '{"lead":"Smaller rooms, real names.","linkHref":"/community"}'::jsonb,
  true, now()
)
on conflict (slug) do update set kind = excluded.kind, sort_order = excluded.sort_order, data = excluded.data;

insert into content_blocks (slug, kind, sort_order, title, body, data, is_published, published_at)
values (
  'home-belonging', 'pinned', 60,
  'You are not a *visitor* here for long.',
  'Come once and you are a guest. Come twice and someone will remember your name and ask about the thing you mentioned.',
  '{"secondaryTitle":"That is the whole method. There isn''t a programme underneath it.","secondaryBody":"No welcome desk, no visitor card, no follow-up sequence. Just people who were new here recently enough to remember what it felt like.","linkLabel":"How we are put together","linkHref":"/community"}'::jsonb,
  true, now()
)
on conflict (slug) do update set kind = excluded.kind, sort_order = excluded.sort_order, data = excluded.data;

insert into content_blocks (slug, kind, sort_order, title, body, data, is_published, published_at)
values (
  'home-teaching-list', 'teaching_list', 70,
  'Recent *teaching*',
  null,
  '{"linkLabel":"Everything","linkHref":"/teaching","limit":3}'::jsonb,
  true, now()
)
on conflict (slug) do update set kind = excluded.kind, sort_order = excluded.sort_order, data = excluded.data;

insert into content_blocks (slug, kind, sort_order, title, body, data, is_published, published_at)
values (
  'home-cta', 'cta', 80,
  'The work is *funded* by the people in it',
  'Partners give monthly by mobile money. It pays for the room, the sound, the travel, and the people who carry the work through the week.',
  '{"primaryLabel":"Become a partner","primaryHref":"/partnership","secondaryLabel":"Give once","secondaryHref":"/give","secondaryTitle":"How monthly giving works here","secondaryBody":"Mobile money in Ghana cannot charge you automatically — there is no standing authorisation to keep on file. So a monthly pledge is exactly that: we send you a reminder when your month comes round, and you approve the prompt on your own handset. Nothing is ever taken without you."}'::jsonb,
  true, now()
)
on conflict (slug) do update set kind = excluded.kind, sort_order = excluded.sort_order, data = excluded.data;
