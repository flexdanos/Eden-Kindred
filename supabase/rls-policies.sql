-- ============================================================================
-- Row Level Security — Eden Kindred
-- Run AFTER `npm run db:push` (or drizzle-kit migrate) has created the tables.
--
-- READ THIS FIRST — what RLS is and is not doing here.
--
-- Drizzle connects over a direct Postgres connection as a privileged role, so
-- RLS never evaluates on any Drizzle query. These policies are a BACKSTOP for
-- the anon/authenticated keys that reach Postgres through PostgREST and the
-- Supabase client. They are not the authorisation layer for the admin console.
--
-- Every admin Server Action must call assertAdmin() itself. See
-- src/lib/auth/guard.ts. There is no policy here that will save you if it
-- doesn't.
-- ============================================================================

-- ── Helpers ──────────────────────────────────────────────────────────────
-- SECURITY DEFINER so a policy on `profiles` can read `profiles` without
-- recursing into its own RLS check.

create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_admin_or_editor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'editor'), false);
$$;

-- ── Keep profiles in sync with auth.users ────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── profiles ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: staff read all" on public.profiles;
create policy "profiles: staff read all"
  on public.profiles for select
  using (public.is_admin_or_editor());

-- FIX (was: `with check (auth.uid() = id and role = 'member')`).
-- That forced every self-update to write role='member', which locked editors
-- out of editing their own profile entirely. Pin the role to whatever it
-- already is instead — self-promotion is still impossible, but an editor can
-- change their own name.
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "profiles: admins update any" on public.profiles;
create policy "profiles: admins update any"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── content_blocks ───────────────────────────────────────────────────────
alter table public.content_blocks enable row level security;

drop policy if exists "content_blocks: public reads published" on public.content_blocks;
create policy "content_blocks: public reads published"
  on public.content_blocks for select
  using (is_published = true);

drop policy if exists "content_blocks: staff read all" on public.content_blocks;
create policy "content_blocks: staff read all"
  on public.content_blocks for select
  using (public.is_admin_or_editor());

drop policy if exists "content_blocks: staff insert" on public.content_blocks;
create policy "content_blocks: staff insert"
  on public.content_blocks for insert
  with check (public.is_admin_or_editor());

drop policy if exists "content_blocks: staff update" on public.content_blocks;
create policy "content_blocks: staff update"
  on public.content_blocks for update
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

drop policy if exists "content_blocks: admins delete" on public.content_blocks;
create policy "content_blocks: admins delete"
  on public.content_blocks for delete
  using (public.is_admin());

-- ── posts ────────────────────────────────────────────────────────────────
alter table public.posts enable row level security;

drop policy if exists "posts: public reads published" on public.posts;
create policy "posts: public reads published"
  on public.posts for select
  using (is_published = true);

drop policy if exists "posts: staff read all" on public.posts;
create policy "posts: staff read all"
  on public.posts for select
  using (public.is_admin_or_editor());

drop policy if exists "posts: staff insert" on public.posts;
create policy "posts: staff insert"
  on public.posts for insert
  with check (public.is_admin_or_editor());

drop policy if exists "posts: staff update" on public.posts;
create policy "posts: staff update"
  on public.posts for update
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

drop policy if exists "posts: admins delete" on public.posts;
create policy "posts: admins delete"
  on public.posts for delete
  using (public.is_admin());

-- ── events ───────────────────────────────────────────────────────────────
alter table public.events enable row level security;

drop policy if exists "events: public reads published" on public.events;
create policy "events: public reads published"
  on public.events for select
  using (is_published = true);

drop policy if exists "events: staff manage" on public.events;
create policy "events: staff manage"
  on public.events for all
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

-- ── media_assets ─────────────────────────────────────────────────────────
-- FIX (was: `using (true)` for public select).
-- Blanket read leaked the storage paths of imagery attached to unpublished
-- drafts. Restrict anon reads to assets actually referenced by something
-- published.
alter table public.media_assets enable row level security;

drop policy if exists "media_assets: public reads referenced" on public.media_assets;
create policy "media_assets: public reads referenced"
  on public.media_assets for select
  using (
    exists (select 1 from public.posts p
             where p.cover_media_id = media_assets.id and p.is_published)
    or exists (select 1 from public.events e
             where e.cover_media_id = media_assets.id and e.is_published)
    or exists (select 1 from public.content_blocks c
             where c.media_id = media_assets.id and c.is_published)
  );

drop policy if exists "media_assets: staff read all" on public.media_assets;
create policy "media_assets: staff read all"
  on public.media_assets for select
  using (public.is_admin_or_editor());

drop policy if exists "media_assets: staff insert" on public.media_assets;
create policy "media_assets: staff insert"
  on public.media_assets for insert
  with check (public.is_admin_or_editor());

drop policy if exists "media_assets: admins delete" on public.media_assets;
create policy "media_assets: admins delete"
  on public.media_assets for delete
  using (public.is_admin());

-- ── partnership_tiers ────────────────────────────────────────────────────
alter table public.partnership_tiers enable row level security;

drop policy if exists "tiers: public reads active" on public.partnership_tiers;
create policy "tiers: public reads active"
  on public.partnership_tiers for select
  using (is_active = true);

drop policy if exists "tiers: admins manage" on public.partnership_tiers;
create policy "tiers: admins manage"
  on public.partnership_tiers for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── donations ────────────────────────────────────────────────────────────
-- FIX — this is the important one.
--
-- The original policy was:
--   create policy "donations: public can read opted-in display rows only"
--     on public.donations for select using (is_public_display = true);
--
-- RLS filters ROWS, not COLUMNS. That policy handed anyone holding the anon
-- key every column of those rows: donor_email, donor_phone, amount, and the
-- provider reference. The opt-in was only ever meant to show a name on a
-- ticker.
--
-- There is now NO public select policy on this table at all. The public feed
-- reads `public_partners` below, which projects two safe columns.

alter table public.donations enable row level security;

drop policy if exists "donations: public can read opted-in display rows only" on public.donations;

drop policy if exists "donations: donors read own" on public.donations;
create policy "donations: donors read own"
  on public.donations for select
  using (auth.uid() = donor_profile_id);

drop policy if exists "donations: admins read all" on public.donations;
create policy "donations: admins read all"
  on public.donations for select
  using (public.is_admin());

-- No insert/update/delete policies for anon or authenticated. Every write
-- happens server-side in the Paystack webhook handler.

-- ── public_partners view ─────────────────────────────────────────────────
-- security_invoker is left OFF (the default), so the view runs as its owner
-- and can read `donations` despite the table having no public select policy.
-- That is the entire point: the view is the column filter.

drop view if exists public.public_partners;
create view public.public_partners as
  select
    coalesce(nullif(trim(d.donor_name), ''), 'A partner') as partner_name,
    d.paid_at
  from public.donations d
  where d.is_public_display = true
    and d.status = 'succeeded'
    and d.paid_at is not null;

revoke all on public.public_partners from anon, authenticated;
grant select on public.public_partners to anon, authenticated;

comment on view public.public_partners is
  'Column-filtered public feed of opted-in gifts. Never expose public.donations directly.';

-- ── pledges ──────────────────────────────────────────────────────────────
alter table public.pledges enable row level security;

drop policy if exists "pledges: partners read own" on public.pledges;
create policy "pledges: partners read own"
  on public.pledges for select
  using (auth.uid() = profile_id);

drop policy if exists "pledges: admins read all" on public.pledges;
create policy "pledges: admins read all"
  on public.pledges for select
  using (public.is_admin());

drop policy if exists "pledges: partners pause own" on public.pledges;
create policy "pledges: partners pause own"
  on public.pledges for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id and status in ('active', 'paused', 'ended'));

drop policy if exists "pledges: admins manage" on public.pledges;
create policy "pledges: admins manage"
  on public.pledges for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── pledge_periods ───────────────────────────────────────────────────────
alter table public.pledge_periods enable row level security;

drop policy if exists "pledge_periods: partners read own" on public.pledge_periods;
create policy "pledge_periods: partners read own"
  on public.pledge_periods for select
  using (
    exists (select 1 from public.pledges p
             where p.id = pledge_periods.pledge_id and p.profile_id = auth.uid())
  );

drop policy if exists "pledge_periods: admins read all" on public.pledge_periods;
create policy "pledge_periods: admins read all"
  on public.pledge_periods for select
  using (public.is_admin());

-- Writes are server-side only (the reminder job and the webhook).

-- ── webhook_events ───────────────────────────────────────────────────────
-- Locked entirely. Server-side only; no policies means no access for
-- anon/authenticated once RLS is on.
alter table public.webhook_events enable row level security;

-- ── site_settings ────────────────────────────────────────────────────────
alter table public.site_settings enable row level security;

drop policy if exists "site_settings: public reads" on public.site_settings;
create policy "site_settings: public reads"
  on public.site_settings for select
  using (true);

drop policy if exists "site_settings: admins manage" on public.site_settings;
create policy "site_settings: admins manage"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());
