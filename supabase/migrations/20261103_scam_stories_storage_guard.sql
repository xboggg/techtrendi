-- Scam story photo/video uploads (bucket "scam-stories").
-- The public "Pin your story" form on /scam-stories needs no login, so visitors must
-- still be able to upload. Until now ANY upload was accepted with no limit, which let
-- anyone use the bucket as free file hosting under db2.techtrendi.com, and anyone could
-- list every file in it (pending stories included). This keeps the form working but:
--  1. files go only at the top of the bucket, as the form does (no folders);
--  2. flood cap across the whole bucket: under 20 new files an hour and 60 a day;
--  3. listing the bucket is for admins/editors only. Public links keep working: the
--     bucket is public, so /object/public/ links don't go through these rules.
-- Undo: 20261103_scam_stories_storage_guard_rollback.sql

create or replace function techtrendi.scam_story_upload_allowed(_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select position('/' in _name) = 0
     and (select count(*) from storage.objects o
          where o.bucket_id = 'scam-stories' and o.created_at > now() - interval '1 hour') < 20
     and (select count(*) from storage.objects o
          where o.bucket_id = 'scam-stories' and o.created_at > now() - interval '1 day') < 60;
$$;
revoke all on function techtrendi.scam_story_upload_allowed(text) from public;
grant execute on function techtrendi.scam_story_upload_allowed(text) to anon, authenticated;

drop policy if exists "Anyone can upload story media" on storage.objects;
create policy "scam story media upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'scam-stories' and techtrendi.scam_story_upload_allowed(name));

drop policy if exists "Anyone can view story media" on storage.objects;
create policy "scam story media staff read" on storage.objects for select to authenticated
  using (bucket_id = 'scam-stories' and techtrendi.has_any_role(array['admin', 'editor']));
