-- Short links for /tools/url-shortener (techtrendi.com/s/<code>), 28 Nov 2026.
--
-- Safety design:
--  * Visitors never touch the tables directly. Everything goes through the functions below
--    (SECURITY DEFINER), and RLS has no public policy at all.
--  * Opening a short link never jumps straight to the site: /s/<code> shows
--    "You are going to: <site>" first, and the visitor taps Continue.
--  * Links to other link shorteners, to bare IP addresses, to non-web addresses or with
--    hidden "user@" tricks are refused. Custom names that pretend to be a bank, MoMo, a
--    government office or a big brand are refused.
--  * Each visitor (by a salted hash of their internet address, never the address itself)
--    can make 10 links an hour and 30 a day; the whole site at most 300 an hour.
--  * Three different visitors reporting a link pause it until an admin looks.
--  * The creator gets a private key (kept in their browser) that shows clicks and deletes
--    the link. Only a hash of the key is stored.
--
-- Re-runnable.

create table if not exists techtrendi.short_links (
  code          text primary key check (code ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  target_url    text not null check (length(target_url) <= 2000),
  target_host   text not null,
  status        text not null default 'active' check (status in ('active', 'paused', 'blocked', 'deleted')),
  clicks        integer not null default 0,
  last_click_at timestamptz,
  reports       integer not null default 0,
  manage_hash   text not null,
  creator_hash  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- Admin review (Telegram Block / It's fine buttons, /opt/tech-news/short_links_watch.py):
-- notified_reports = how many reports the admin has already been told about;
-- reviewed_ok = an admin looked and said it's fine, so new reports no longer pause it.
alter table techtrendi.short_links add column if not exists notified_reports integer not null default 0;
alter table techtrendi.short_links add column if not exists reviewed_ok boolean not null default false;

create index if not exists short_links_creator_time on techtrendi.short_links (creator_hash, created_at desc);
create index if not exists short_links_created_at on techtrendi.short_links (created_at desc);
create index if not exists short_links_status on techtrendi.short_links (status) where status <> 'active';

create table if not exists techtrendi.short_link_reports (
  code          text not null references techtrendi.short_links (code) on delete cascade,
  reporter_hash text not null,
  reason        text,
  created_at    timestamptz not null default now(),
  primary key (code, reporter_hash)
);

-- One secret salt, readable only inside the functions below.
create table if not exists techtrendi.short_link_secret (
  id   boolean primary key default true check (id),
  salt text not null
);
insert into techtrendi.short_link_secret (salt)
values (encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (id) do nothing;

alter table techtrendi.short_links enable row level security;
alter table techtrendi.short_link_reports enable row level security;
alter table techtrendi.short_link_secret enable row level security;

drop policy if exists short_links_admin_all on techtrendi.short_links;
create policy short_links_admin_all on techtrendi.short_links for all to authenticated
  using (techtrendi.is_admin()) with check (techtrendi.is_admin());
drop policy if exists short_link_reports_admin_all on techtrendi.short_link_reports;
create policy short_link_reports_admin_all on techtrendi.short_link_reports for all to authenticated
  using (techtrendi.is_admin()) with check (techtrendi.is_admin());

revoke all on techtrendi.short_links, techtrendi.short_link_reports, techtrendi.short_link_secret from anon, authenticated;
grant select, update on techtrendi.short_links to authenticated;          -- admins only, via policy
grant select, delete on techtrendi.short_link_reports to authenticated;   -- admins only, via policy
grant all on techtrendi.short_links, techtrendi.short_link_reports, techtrendi.short_link_secret to service_role;

-- The visitor's address as the site's own nginx saw it. Cloudflare -> nginx (real IP) ->
-- Kong -> PostgREST; nginx appends its $remote_addr to X-Forwarded-For and Kong then appends
-- its own, so the second-to-last entry is the one a visitor cannot fake.
create or replace function techtrendi.short_link_visitor()
returns text
language plpgsql
stable
security definer
set search_path to 'techtrendi', 'extensions', 'pg_temp'
as $$
declare
  xff   text := coalesce(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', '');
  parts text[];
  ip    text;
begin
  parts := string_to_array(replace(xff, ' ', ''), ',');
  if coalesce(array_length(parts, 1), 0) >= 2 then
    ip := parts[array_length(parts, 1) - 1];
  else
    ip := coalesce(parts[1], 'unknown');
  end if;
  return encode(digest(ip || ':' || (select salt from techtrendi.short_link_secret), 'sha256'), 'hex');
end $$;

-- Custom names that could pass for a bank, MoMo, a government office or a big brand.
-- Short words must be a whole part of the name (so "grace" and "spinach" are fine,
-- "gra-refund" is not); long brand names are refused anywhere in the name.
create or replace function techtrendi.short_link_bad_alias(p_alias text)
returns boolean
language sql
immutable
as $$
  select exists (
           select 1 from unnest(string_to_array(p_alias, '-')) w
           where w in ('momo', 'mtn', 'at', 'bank', 'gcb', 'absa', 'cbg', 'uba', 'bog', 'nia', 'gra', 'ssnit',
                       'ecg', 'nhis', 'dvla', 'gov', 'govt', 'pin', 'otp', 'visa', 'admin', 'police', 'army',
                       'login', 'logon', 'verify', 'secure', 'account', 'support', 'refund', 'reward', 'prize',
                       'promo', 'bonus', 'loan', 'official', 'apple', 'meta', 'x', 'access', 'zenith', 'fidelity'))
      or p_alias ~ '(momo|mobilemoney|mobile-money|telecel|vodafone|airteltigo|ecobank|stanbic|calbank|gtbank|ghanacard|ghana-card|ministry|passport|paypal|google|gmail|whatsapp|facebook|instagram|tiktok|telegram|microsoft|amazon|netflix|binance|wallet|signin|sign-in|log-in|verification|password|helpdesk|techtrendi|bank)'
$$;

create or replace function techtrendi.create_short_link(p_url text, p_alias text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path to 'techtrendi', 'extensions', 'pg_temp'
as $$
declare
  u       text := btrim(coalesce(p_url, ''));
  alias   text := lower(btrim(coalesce(p_alias, '')));
  host    text;
  who     text := techtrendi.short_link_visitor();
  c       text;
  token   text;
  tries   int := 0;
  chars   text := 'abcdefghjkmnpqrstuvwxyz23456789';
begin
  -- Address checks
  if length(u) < 11 or length(u) > 2000 or u ~ '\s' then
    return jsonb_build_object('error', 'invalid');
  end if;
  if u !~* '^https?://' then
    return jsonb_build_object('error', 'invalid');
  end if;
  host := lower(substring(u from '^[A-Za-z]+://([^/?#]*)'));
  if host is null or host = '' or position('@' in host) > 0 then
    return jsonb_build_object('error', 'hidden_user');
  end if;
  host := regexp_replace(host, ':[0-9]{1,5}$', '');
  if host ~ '^[0-9.]+$' or host ~ '^\[' or host !~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9]$' then
    return jsonb_build_object('error', 'bad_host');
  end if;
  if host in ('localhost') or host ~ '\.(local|internal|lan|localhost)$' then
    return jsonb_build_object('error', 'bad_host');
  end if;
  -- No chains of short links: they hide where a link really goes.
  if host ~ '(^|\.)(bit\.ly|bitly\.com|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|v\.gd|cutt\.ly|rebrand\.ly|shorturl\.at|tiny\.cc|rb\.gy|s\.id|t\.ly|buff\.ly|short\.io|shorte\.st|adf\.ly|bl\.ink|lnkd\.in|tiny\.one|qrco\.de|urlz\.fr|shorturl\.asia|clck\.ru|u\.to|x\.gd|surl\.li|t\.me\.ly)$' then
    return jsonb_build_object('error', 'shortener');
  end if;
  if (host = 'techtrendi.com' or host = 'www.techtrendi.com') and u ~* '^https?://[^/]+/s/' then
    return jsonb_build_object('error', 'shortener');
  end if;

  -- Custom name checks
  if alias <> '' then
    if alias !~ '^[a-z0-9][a-z0-9-]{2,29}$' or alias ~ '--' or alias ~ '-$' then
      return jsonb_build_object('error', 'alias_bad');
    end if;
    if techtrendi.short_link_bad_alias(alias) then
      return jsonb_build_object('error', 'alias_blocked');
    end if;
    if exists (select 1 from techtrendi.short_links where code = alias) then
      return jsonb_build_object('error', 'alias_taken');
    end if;
  end if;

  -- Flood brakes. One creation at a time (until this transaction ends), so requests sent
  -- at the same moment cannot all pass the counts before any of them is saved.
  perform pg_advisory_xact_lock(hashtext('techtrendi.create_short_link'));
  if (select count(*) from techtrendi.short_links where creator_hash = who and created_at > now() - interval '1 hour') >= 10
     or (select count(*) from techtrendi.short_links where creator_hash = who and created_at > now() - interval '1 day') >= 30 then
    return jsonb_build_object('error', 'too_many');
  end if;
  if (select count(*) from techtrendi.short_links where created_at > now() - interval '1 hour') >= 300 then
    return jsonb_build_object('error', 'busy');
  end if;

  token := encode(gen_random_bytes(24), 'hex');

  if alias <> '' then
    c := alias;
  else
    loop
      tries := tries + 1;
      c := '';
      for i in 1..6 loop
        c := c || substr(chars, 1 + (get_byte(gen_random_bytes(1), 0) % length(chars)), 1);
      end loop;
      exit when not exists (select 1 from techtrendi.short_links where code = c);
      if tries > 20 then
        return jsonb_build_object('error', 'busy');
      end if;
    end loop;
  end if;

  begin
    insert into techtrendi.short_links (code, target_url, target_host, manage_hash, creator_hash)
    values (c, u, host, encode(digest(token, 'sha256'), 'hex'), who);
  exception when unique_violation then
    return jsonb_build_object('error', 'alias_taken');
  end;

  return jsonb_build_object('code', c, 'token', token, 'host', host, 'url', u);
end $$;

-- What /s/<code> shows before the visitor decides. Does not count a click.
create or replace function techtrendi.get_short_link(p_code text)
returns jsonb
language sql
stable
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
  select case
    when l.code is null then jsonb_build_object('status', 'missing')
    when l.status in ('active') then jsonb_build_object('status', 'active', 'url', l.target_url, 'host', l.target_host, 'created_at', l.created_at)
    when l.status = 'paused' then jsonb_build_object('status', 'paused', 'host', l.target_host)
    else jsonb_build_object('status', 'gone')
  end
  from (select 1) one
  left join techtrendi.short_links l on l.code = lower(btrim(coalesce(p_code, '')))
$$;

-- Counts a click when the visitor taps Continue, and returns the address to go to.
create or replace function techtrendi.follow_short_link(p_code text)
returns text
language plpgsql
volatile
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
declare u text;
begin
  update techtrendi.short_links
     set clicks = clicks + 1, last_click_at = now()
   where code = lower(btrim(coalesce(p_code, ''))) and status = 'active'
  returning target_url into u;
  return u;
end $$;

-- The creator's own links: clicks and status, only with the right private key.
create or replace function techtrendi.short_link_stats(p_items jsonb)
returns jsonb
language sql
stable
security definer
set search_path to 'techtrendi', 'extensions', 'pg_temp'
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', l.code, 'url', l.target_url, 'host', l.target_host, 'status', l.status,
           'clicks', l.clicks, 'last_click_at', l.last_click_at, 'created_at', l.created_at)
         order by l.created_at desc), '[]'::jsonb)
  from (
    select x ->> 'code' as code, x ->> 'token' as token
    from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) x
    limit 200
  ) i
  join techtrendi.short_links l
    on l.code = i.code and l.manage_hash = encode(digest(coalesce(i.token, ''), 'sha256'), 'hex')
  where l.status <> 'deleted'
$$;

create or replace function techtrendi.delete_short_link(p_code text, p_token text)
returns boolean
language plpgsql
volatile
security definer
set search_path to 'techtrendi', 'extensions', 'pg_temp'
as $$
declare n int;
begin
  update techtrendi.short_links
     set status = 'deleted', updated_at = now()
   where code = lower(btrim(coalesce(p_code, '')))
     and manage_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and status in ('active', 'paused');
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- "Report this link" on /s/<code>. One report per visitor per link; 3 pause the link.
create or replace function techtrendi.report_short_link(p_code text, p_reason text default null)
returns text
language plpgsql
volatile
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
declare
  c   text := lower(btrim(coalesce(p_code, '')));
  who text := techtrendi.short_link_visitor();
  n   int;
begin
  if not exists (select 1 from techtrendi.short_links where code = c and status in ('active', 'paused')) then
    return 'missing';
  end if;
  if (select count(*) from techtrendi.short_link_reports where reporter_hash = who and created_at > now() - interval '1 day') >= 20 then
    return 'thanks';
  end if;
  insert into techtrendi.short_link_reports (code, reporter_hash, reason)
  values (c, who, left(nullif(btrim(coalesce(p_reason, '')), ''), 300))
  on conflict do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    update techtrendi.short_links
       set reports = reports + 1,
           status = case when status = 'active' and not reviewed_ok and reports + 1 >= 3 then 'paused' else status end,
           updated_at = now()
     where code = c;
  end if;
  return 'thanks';
end $$;

revoke all on function techtrendi.short_link_visitor() from public, anon, authenticated;
revoke all on function techtrendi.short_link_bad_alias(text) from public, anon, authenticated;
revoke all on function techtrendi.create_short_link(text, text) from public;
revoke all on function techtrendi.get_short_link(text) from public;
revoke all on function techtrendi.follow_short_link(text) from public;
revoke all on function techtrendi.short_link_stats(jsonb) from public;
revoke all on function techtrendi.delete_short_link(text, text) from public;
revoke all on function techtrendi.report_short_link(text, text) from public;
grant execute on function techtrendi.create_short_link(text, text) to anon, authenticated;
grant execute on function techtrendi.get_short_link(text) to anon, authenticated;
grant execute on function techtrendi.follow_short_link(text) to anon, authenticated;
grant execute on function techtrendi.short_link_stats(jsonb) to anon, authenticated;
grant execute on function techtrendi.delete_short_link(text, text) to anon, authenticated;
grant execute on function techtrendi.report_short_link(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
