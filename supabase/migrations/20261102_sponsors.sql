-- Paid sponsor ads (direct ads, not AdSense), managed from /admin/sponsors (owner,
-- 2 Nov 2026). Each sponsor can be given ONE login (owner_id) that may edit ONLY
-- that sponsor's wording at /my-ad. The landing page is /sponsored/<slug>.
--
-- Who can do what (row level security + the guard trigger below):
--   visitors      read active sponsors
--   owner         read + edit `content` of their own sponsor only; a new picture
--                 goes to content.pendingHeroImage and waits for an admin
--   admin         everything (create, delete, switch on/off, pages, owner, approve picture)
-- For EVERYONE (admins too) the guard refuses wording that would put AdSense at risk:
-- iCloud / Activation Lock removal and "bypass" / FRP are not allowed on TechTrendi.
-- Pictures: storage bucket `sponsor-images`, folder = slug; owner may upload only
-- into their own sponsor's folder.
-- Rollback: supabase/migrations/20261102_sponsors_rollback.sql

create table if not exists techtrendi.sponsors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  active boolean not null default false,
  owner_id uuid references auth.users(id) on delete set null,
  owner_email text,
  show_on text[] not null default '{}',
  sort_order integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create index if not exists sponsors_owner_idx on techtrendi.sponsors (owner_id);

-- Words that must never appear in an ad on TechTrendi (AdSense: no promoting
-- getting around security protections). Checked on the whole content, any case.
create or replace function techtrendi.sponsor_banned_words(_content jsonb)
returns text
language sql
immutable
set search_path to 'pg_temp'
as $$
  select (regexp_match(lower(_content::text), '(\mi[ -]?cloud|activation[ -]*lock|\mby[ -]?pass|\mfrp\M|\mmdm[ -]*remov|find[ -]*my[ -]*(iphone|device)[ -]*(off|remov))'))[1];
$$;

create or replace function techtrendi.sponsors_guard()
returns trigger
language plpgsql
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
declare
  bad text;
  is_adm boolean := techtrendi.is_admin();
begin
  bad := techtrendi.sponsor_banned_words(new.content);
  if bad is not null then
    raise exception 'Not allowed on TechTrendi: "%". Ads here cannot mention iCloud/Activation Lock removal or bypassing.', bad
      using errcode = 'check_violation';
  end if;

  if new.content ? 'phone' and coalesce(new.content->>'phone', '') !~ '^[0-9]{8,15}$' then
    raise exception 'Phone number: digits only, with country code (e.g. 233546616401).' using errcode = 'check_violation';
  end if;

  if tg_op = 'UPDATE' and not is_adm then
    -- Owner: only the wording may change.
    if new.slug is distinct from old.slug or new.active is distinct from old.active
       or new.owner_id is distinct from old.owner_id or new.owner_email is distinct from old.owner_email
       or new.show_on is distinct from old.show_on or new.sort_order is distinct from old.sort_order then
      raise exception 'Only an admin can change the address, pages, owner or on/off switch of an ad.' using errcode = 'insufficient_privilege';
    end if;
    -- Owner: the live picture can only change through admin approval.
    if (new.content->'heroImage') is distinct from (old.content->'heroImage') then
      raise exception 'A new picture waits for admin approval: upload it as the pending picture.' using errcode = 'insufficient_privilege';
    end if;
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists sponsors_guard on techtrendi.sponsors;
create trigger sponsors_guard before insert or update on techtrendi.sponsors
  for each row execute function techtrendi.sponsors_guard();

alter table techtrendi.sponsors enable row level security;

drop policy if exists sponsors_read on techtrendi.sponsors;
create policy sponsors_read on techtrendi.sponsors
  for select using (active or owner_id = auth.uid() or techtrendi.is_admin());

drop policy if exists sponsors_owner_update on techtrendi.sponsors;
create policy sponsors_owner_update on techtrendi.sponsors
  for update using (owner_id = auth.uid() or techtrendi.is_admin())
  with check (owner_id = auth.uid() or techtrendi.is_admin());

drop policy if exists sponsors_admin_insert on techtrendi.sponsors;
create policy sponsors_admin_insert on techtrendi.sponsors
  for insert with check (techtrendi.is_admin());

drop policy if exists sponsors_admin_delete on techtrendi.sponsors;
create policy sponsors_admin_delete on techtrendi.sponsors
  for delete using (techtrendi.is_admin());

grant select on techtrendi.sponsors to anon;
grant select, insert, update, delete on techtrendi.sponsors to authenticated;
grant all on techtrendi.sponsors to service_role;

-- Admin only: link an ad to the login with this email (the person signs up first).
-- Returns false when no account has that email. Empty email = remove the owner.
create or replace function techtrendi.set_sponsor_owner(_sponsor uuid, _email text)
returns boolean
language plpgsql
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
declare
  uid uuid;
  e text := lower(trim(coalesce(_email, '')));
begin
  if not techtrendi.is_admin() then
    raise exception 'Admins only' using errcode = 'insufficient_privilege';
  end if;
  if e = '' then
    update techtrendi.sponsors set owner_id = null, owner_email = null where id = _sponsor;
    return true;
  end if;
  select id into uid from auth.users where lower(email) = e limit 1;
  if uid is null then
    return false;
  end if;
  update techtrendi.sponsors set owner_id = uid, owner_email = e where id = _sponsor;
  return true;
end;
$$;

revoke all on function techtrendi.set_sponsor_owner(uuid, text) from public, anon;
grant execute on function techtrendi.set_sponsor_owner(uuid, text) to authenticated;

-- Used by the storage policies: may the current user put files in this sponsor folder?
create or replace function techtrendi.can_edit_sponsor_folder(_folder text)
returns boolean
language sql
stable
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
  select techtrendi.is_admin()
      or exists (select 1 from techtrendi.sponsors s where s.slug = _folder and s.owner_id = auth.uid());
$$;

grant execute on function techtrendi.can_edit_sponsor_folder(text) to authenticated;

-- Pictures: public to read; write only into a folder you may edit. Max 1 MB, images only
-- (the editors shrink pictures to under 300 KB before uploading).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sponsor-images', 'sponsor-images', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "sponsor images read" on storage.objects;
create policy "sponsor images read" on storage.objects
  for select using (bucket_id = 'sponsor-images');

drop policy if exists "sponsor images insert" on storage.objects;
create policy "sponsor images insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'sponsor-images' and techtrendi.can_edit_sponsor_folder((storage.foldername(name))[1]));

drop policy if exists "sponsor images update" on storage.objects;
create policy "sponsor images update" on storage.objects
  for update to authenticated
  using (bucket_id = 'sponsor-images' and techtrendi.can_edit_sponsor_folder((storage.foldername(name))[1]))
  with check (bucket_id = 'sponsor-images' and techtrendi.can_edit_sponsor_folder((storage.foldername(name))[1]));

drop policy if exists "sponsor images delete" on storage.objects;
create policy "sponsor images delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'sponsor-images' and techtrendi.can_edit_sponsor_folder((storage.foldername(name))[1]));

notify pgrst, 'reload schema';
