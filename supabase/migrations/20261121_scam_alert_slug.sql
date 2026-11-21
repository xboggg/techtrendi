-- Scam alerts: one page per alert (21 Nov 2026, owner asked that each alert be shareable).
-- Each alert gets a stable web address /scam-alerts/<slug>, made from its title when the alert
-- is added. Editing the title later does NOT change the slug, so shared links keep working.
-- The admin form and psql inserts need no change: the trigger fills the slug.
-- Additive only. Rollback: 20261121_scam_alert_slug_rollback.sql

alter table techtrendi.security_scam_alerts add column if not exists slug text;

-- "Fake “DataMart Ghana” cheap data site" -> "fake-datamart-ghana-cheap-data-site".
-- At most 70 characters, cut at a whole word.
create or replace function techtrendi.scam_alert_slug_base(t text)
returns text
language sql
immutable
as $$
  with s as (
    select trim(both '-' from regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g')) as full_slug
  )
  select case
    when length(full_slug) <= 70 then full_slug
    else trim(both '-' from regexp_replace(left(full_slug, 71), '-[^-]*$', ''))
  end
  from s
$$;

create or replace function techtrendi.scam_alerts_fill_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int := 2;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;
  base := techtrendi.scam_alert_slug_base(new.title);
  if base = '' then
    base := 'scam-alert';
  end if;
  candidate := base;
  while exists (
    select 1 from techtrendi.security_scam_alerts
    where slug = candidate and id is distinct from new.id
  ) loop
    candidate := base || '-' || n;
    n := n + 1;
  end loop;
  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists scam_alerts_fill_slug on techtrendi.security_scam_alerts;
create trigger scam_alerts_fill_slug
  before insert or update on techtrendi.security_scam_alerts
  for each row execute function techtrendi.scam_alerts_fill_slug();

-- Fill the existing alerts, oldest first (so an older alert keeps the plain slug on a clash).
do $$
declare r record;
begin
  for r in select id from techtrendi.security_scam_alerts where slug is null or slug = '' order by created_at loop
    update techtrendi.security_scam_alerts set slug = null where id = r.id;
  end loop;
end $$;

create unique index if not exists security_scam_alerts_slug_key on techtrendi.security_scam_alerts (slug);
