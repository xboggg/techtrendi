-- Undo 20261103_scam_stories_storage_guard.sql: back to the original open rules.
drop policy if exists "scam story media upload" on storage.objects;
drop policy if exists "scam story media staff read" on storage.objects;
create policy "Anyone can upload story media" on storage.objects for insert
  with check (bucket_id = 'scam-stories');
create policy "Anyone can view story media" on storage.objects for select
  using (bucket_id = 'scam-stories');
drop function if exists techtrendi.scam_story_upload_allowed(text);
