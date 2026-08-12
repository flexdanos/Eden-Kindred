-- ============================================================================
-- Supabase Storage — the `media` bucket
-- Run AFTER supabase/rls-policies.sql (these policies call is_admin_or_editor).
-- ============================================================================

-- Public bucket: objects are readable by URL, which is what lets next/image
-- fetch and cache them from the CDN without signing every request.
--
-- The tradeoff, stated plainly: an image attached to an UNPUBLISHED draft is
-- readable by anyone who has its URL. Paths are prefixed with a UUID so they
-- are not enumerable or guessable, and the `media_assets` table still refuses
-- to list them to the anon key. If you ever store something genuinely private
-- here, use a separate private bucket and signed URLs instead.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  8388608, -- 8 MB. Enforced by Storage itself, not just the client.
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Object policies ──────────────────────────────────────────────────────
-- Uploads go straight from the admin's browser to Storage using the anon key
-- plus their session, so these policies are the real gate on writing. This is
-- the one place RLS genuinely enforces rather than backstops: Drizzle is not
-- in this path at all.

drop policy if exists "media: public read" on storage.objects;
create policy "media: public read"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media: staff upload" on storage.objects;
create policy "media: staff upload"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin_or_editor());

drop policy if exists "media: staff update" on storage.objects;
create policy "media: staff update"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_admin_or_editor())
  with check (bucket_id = 'media' and public.is_admin_or_editor());

drop policy if exists "media: admins delete" on storage.objects;
create policy "media: admins delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
