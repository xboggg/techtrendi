-- Undo 20261102_sponsors.sql. Removes the sponsors table, its functions, the
-- storage policies and the (empty) bucket. Uploaded pictures in the bucket are
-- NOT deleted by this file: empty the bucket by hand first if you mean to drop it.
drop policy if exists "sponsor images read" on storage.objects;
drop policy if exists "sponsor images insert" on storage.objects;
drop policy if exists "sponsor images update" on storage.objects;
drop policy if exists "sponsor images delete" on storage.objects;
delete from storage.buckets where id = 'sponsor-images'
  and not exists (select 1 from storage.objects where bucket_id = 'sponsor-images');
drop table if exists techtrendi.sponsors;
drop function if exists techtrendi.sponsors_guard();
drop function if exists techtrendi.sponsor_banned_words(jsonb);
drop function if exists techtrendi.set_sponsor_owner(uuid, text);
drop function if exists techtrendi.can_edit_sponsor_folder(text);
notify pgrst, 'reload schema';
