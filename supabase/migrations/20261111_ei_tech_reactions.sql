-- Ei Tech! reactions (owner, 11 Nov 2026): on /ei-tech every meme has a 😂 "laugh"
-- button, and memes that have a vote in src/data/eiTech.ts get a two-sided vote
-- ("Team iPhone / Team Cow"). Anonymous, no sign-in.
--   visitors  can only react through ei_tech_react (no direct table access);
--             one laugh and one vote per browser per meme (a random id the browser
--             keeps); voting again for the other side moves the vote.
--             Flood cap: at most 120 reactions per meme per minute site-wide.
--   everyone  reads the totals through ei_tech_counts (numbers only, never ids).
-- Residual risk (accepted, like the arcade scores): someone clearing their browser
-- can vote again. These are fun counts, not elections.
-- Rollback: supabase/migrations/20261111_ei_tech_reactions_rollback.sql

create table if not exists techtrendi.ei_tech_reactions (
  id bigint generated always as identity primary key,
  meme_slug text not null check (meme_slug ~ '^[a-z0-9-]{1,80}$'),
  kind text not null check (kind in ('laugh', 'vote')),
  choice text not null check ((kind = 'laugh' and choice = 'laugh') or (kind = 'vote' and choice in ('a', 'b'))),
  voter text not null check (voter ~ '^[0-9a-f-]{36}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meme_slug, kind, voter)
);

create index if not exists ei_tech_reactions_slug_time_idx on techtrendi.ei_tech_reactions (meme_slug, created_at);

alter table techtrendi.ei_tech_reactions enable row level security;
drop policy if exists ei_tech_reactions_admin_read on techtrendi.ei_tech_reactions;
create policy ei_tech_reactions_admin_read on techtrendi.ei_tech_reactions for select using (techtrendi.is_admin());
revoke all on techtrendi.ei_tech_reactions from anon, authenticated;
grant select on techtrendi.ei_tech_reactions to authenticated;

-- Record a laugh or a vote; returns that meme's new totals (same shape as ei_tech_counts).
create or replace function techtrendi.ei_tech_react(p_slug text, p_kind text, p_choice text, p_voter text)
returns jsonb
language plpgsql
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
begin
  if p_slug is null or p_slug !~ '^[a-z0-9-]{1,80}$' then return null; end if;
  if p_voter is null or p_voter !~ '^[0-9a-f-]{36}$' then return null; end if;
  if not ((p_kind = 'laugh' and p_choice = 'laugh') or (p_kind = 'vote' and p_choice in ('a', 'b'))) then return null; end if;

  if (select count(*) from techtrendi.ei_tech_reactions
      where meme_slug = p_slug and updated_at > now() - interval '1 minute') >= 120 then
    return techtrendi.ei_tech_counts(array[p_slug]) -> p_slug;
  end if;

  insert into techtrendi.ei_tech_reactions (meme_slug, kind, choice, voter)
  values (p_slug, p_kind, p_choice, p_voter)
  on conflict (meme_slug, kind, voter) do update
    set choice = excluded.choice, updated_at = now()
    where techtrendi.ei_tech_reactions.choice is distinct from excluded.choice;

  return techtrendi.ei_tech_counts(array[p_slug]) -> p_slug;
end;
$$;

-- Totals for up to 60 memes: {"slug": {"laugh": n, "a": n, "b": n}, ...}
create or replace function techtrendi.ei_tech_counts(p_slugs text[])
returns jsonb
language sql
stable
security definer
set search_path to 'techtrendi', 'pg_temp'
as $$
  select coalesce(jsonb_object_agg(s.slug, jsonb_build_object(
           'laugh', coalesce(c.laugh, 0), 'a', coalesce(c.a, 0), 'b', coalesce(c.b, 0))), '{}'::jsonb)
  from (select distinct unnest(p_slugs[1:60]) as slug) s
  left join (
    select meme_slug,
           count(*) filter (where choice = 'laugh') as laugh,
           count(*) filter (where choice = 'a') as a,
           count(*) filter (where choice = 'b') as b
    from techtrendi.ei_tech_reactions
    where meme_slug = any (p_slugs[1:60])
    group by meme_slug
  ) c on c.meme_slug = s.slug
  where s.slug ~ '^[a-z0-9-]{1,80}$';
$$;

revoke all on function techtrendi.ei_tech_react(text, text, text, text) from public;
revoke all on function techtrendi.ei_tech_counts(text[]) from public;
grant execute on function techtrendi.ei_tech_react(text, text, text, text) to anon, authenticated;
grant execute on function techtrendi.ei_tech_counts(text[]) to anon, authenticated;

notify pgrst, 'reload schema';
