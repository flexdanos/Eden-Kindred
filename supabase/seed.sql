-- ============================================================================
-- Optional seed data — Eden Kindred
--
-- Run AFTER `npm run db:push` and after supabase/rls-policies.sql.
-- Paste into the Supabase SQL editor, or: psql "$DIRECT_URL" -f supabase/seed.sql
--
-- Everything here is safe to re-run: inserts are ON CONFLICT DO NOTHING.
-- Nothing in this file touches donations, pledges, or profiles — money and
-- people are never seeded.
-- ============================================================================

-- ── Page sections ────────────────────────────────────────────────────────
-- The public site renders designed fallbacks when these are absent, so this is
-- about taking control of the copy, not about making the site work.

insert into public.content_blocks (slug, title, body, is_published, published_at)
values
  (
    'home-hero',
    'A community you belong to.',
    'Not an audience you join. We gather to worship, to learn, and to know each other by name.',
    true,
    now()
  ),
  (
    'home-belonging',
    'You are not a visitor here for long.',
    'Come once and you are a guest. Come twice and someone will remember your name and ask about the thing you mentioned. That is the whole method — there isn''t a programme underneath it.',
    true,
    now()
  )
on conflict (slug) do nothing;

-- ── Partnership tiers ────────────────────────────────────────────────────
-- Amounts are PESEWAS. 5000 = ₵50.00.

insert into public.partnership_tiers (name, description, amount_minor, cadence, is_active, sort_order)
values
  ('Kindred',   'Keeps the room, the sound, and the lights on each month.', 5000,  'monthly', true, 1),
  ('Sustainer', 'Covers travel for the team and the midweek gatherings.',   15000, 'monthly', true, 2),
  ('Founder',   'Underwrites new work — new rooms, new cities.',            50000, 'monthly', true, 3)
on conflict do nothing;

-- ── Site settings ────────────────────────────────────────────────────────

insert into public.site_settings (key, value)
values
  ('gathering_timezone', '"Africa/Accra"'::jsonb),
  ('show_partners_feed', 'true'::jsonb),
  ('accountability_note', '"A full breakdown of giving is published each quarter."'::jsonb)
on conflict (key) do nothing;

-- ── A gathering and a post, so the listings aren't empty ─────────────────

insert into public.events (slug, title, description, location, starts_at, is_published)
values
  (
    'sunday-gathering',
    'Sunday gathering',
    'Sung and spoken worship, then teaching. We start on time and finish around two hours later. Come as you are; there is tea afterwards and someone will find you.',
    'The Hall, Osu, Accra',
    date_trunc('week', now()) + interval '6 days' + interval '9 hours',
    true
  )
on conflict (slug) do nothing;

insert into public.posts (slug, title, excerpt, body, is_published, published_at)
values
  (
    'why-we-sing-first',
    'Why we sing first',
    'Worship is not the warm-up to the sermon. It is the thing itself, and the order of our gatherings says so on purpose.',
    E'Most gatherings treat singing as the door you walk through to reach the real room. We do not.\n\nWorship is the practice. The teaching that follows is how we make sense of it together, not the reason we came. Putting the songs first is a small structural claim about what we think is happening when a room sings.\n\nIf you are new, this is the part where you can simply stand and listen. Nobody is counting.',
    true,
    now()
  )
on conflict (slug) do nothing;
