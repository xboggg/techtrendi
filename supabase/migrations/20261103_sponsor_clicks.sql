-- Sponsor ad taps (owner, 3 Nov 2026): every tap on the "Sponsored" card, the
-- WhatsApp button and the Call button, shown in /admin/sponsors next to the ad
-- page's visits (techtrendi.page_views, path /sponsored/<slug>).
--   visitors  can only record a tap through track_sponsor_click (no direct access);
--             same tap from the same browser within 5 seconds counts once;
--             admins' own taps are not counted.
--   admins    read the totals through sponsor_stats().
-- Rollback: supabase/migrations/20261103_sponsor_clicks_rollback.sql

create table if not exists techtrendi.sponsor_clicks (
  id bigint generated always as identity primary key,
  slug text not null,
  kind text not null check (kind in ('card', 'whatsapp', 'call')),
  page_path text,
  session_id text,
  device_type text,
  created_at timestamptz not null default now()
);

create index if not exists sponsor_clicks_slug_time_idx on techtrendi.sponsor_clicks (slug, created_at);

alter table techtrendi.sponsor_clicks enable row level security;
drop policy if exists sponsor_clicks_admin_read on techtrendi.sponsor_clicks;
create policy sponsor_clicks_admin_read on techtrendi.sponsor_clicks for select using (techtrendi.is_admin());
revoke all on techtrendi.sponsor_clicks from anon, authenticated;
grant select on techtrendi.sponsor_clicks to authenticated;

create or replace function techtrendi.track_sponsor_click(p jsonb)
returns boolean
language plpgsql
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
declare
  v_slug text := left(p->>'slug', 100);
  v_kind text := p->>'kind';
  v_sid text := left(p->>'session_id', 100);
begin
  if v_kind is null or v_kind not in ('card', 'whatsapp', 'call') then return false; end if;
  if not exists (select 1 from techtrendi.sponsors where slug = v_slug and active) then return false; end if;
  if techtrendi.is_admin() then return false; end if;
  if v_sid is not null and exists (
    select 1 from techtrendi.sponsor_clicks
    where slug = v_slug and kind = v_kind and session_id = v_sid and created_at > now() - interval '5 seconds'
  ) then return false; end if;
  insert into techtrendi.sponsor_clicks (slug, kind, page_path, session_id, device_type)
  values (v_slug, v_kind, left(p->>'page_path', 300), v_sid, left(p->>'device_type', 20));
  return true;
end;
$$;

revoke all on function techtrendi.track_sponsor_click(jsonb) from public;
grant execute on function techtrendi.track_sponsor_click(jsonb) to anon, authenticated;

-- Totals per ad for Today (Ghana time) / 7 days / 30 days / all time. Admin only.
create or replace function techtrendi.sponsor_stats()
returns table (slug text, period text, visits bigint, visitors bigint, card bigint, whatsapp bigint, call bigint)
language plpgsql
stable
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
begin
  if not techtrendi.is_admin() then
    raise exception 'Admins only' using errcode = 'insufficient_privilege';
  end if;
  return query
  with periods(period, since) as (
    values ('today', (date_trunc('day', now() at time zone 'Africa/Accra')) at time zone 'Africa/Accra'),
           ('7d', now() - interval '7 days'),
           ('30d', now() - interval '30 days'),
           ('all', '-infinity'::timestamptz))
  select s.slug, pr.period,
    (select count(*) from techtrendi.page_views v where v.page_path = '/sponsored/' || s.slug and v.created_at >= pr.since),
    (select count(distinct v.session_id) from techtrendi.page_views v where v.page_path = '/sponsored/' || s.slug and v.created_at >= pr.since),
    (select count(*) from techtrendi.sponsor_clicks c where c.slug = s.slug and c.kind = 'card' and c.created_at >= pr.since),
    (select count(*) from techtrendi.sponsor_clicks c where c.slug = s.slug and c.kind = 'whatsapp' and c.created_at >= pr.since),
    (select count(*) from techtrendi.sponsor_clicks c where c.slug = s.slug and c.kind = 'call' and c.created_at >= pr.since)
  from techtrendi.sponsors s cross join periods pr;
end;
$$;

revoke all on function techtrendi.sponsor_stats() from public;
grant execute on function techtrendi.sponsor_stats() to authenticated;
