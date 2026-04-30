-- DevLinks — Storage setup for post images and avatars.
-- Run this once in your Supabase SQL editor (after schema.sql).

-- 1) Create the bucket. Public so images can be served via getPublicUrl().
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = excluded.public;

-- 2) RLS policies on storage.objects.
-- Anyone can read (matches the public bucket).
drop policy if exists "post-images public read" on storage.objects;
create policy "post-images public read"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- Authenticated users can upload to a folder named after their user id.
drop policy if exists "post-images authenticated insert" on storage.objects;
create policy "post-images authenticated insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update/delete their own files.
drop policy if exists "post-images owner update" on storage.objects;
create policy "post-images owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post-images owner delete" on storage.objects;
create policy "post-images owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
