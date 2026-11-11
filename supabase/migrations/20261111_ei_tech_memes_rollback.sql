-- Rollback of 20261111_ei_tech_memes.sql: puts ei_tech_react back to the version from
-- 20261111_ei_tech_reactions.sql (no published-meme check), then removes the meme table.
-- The website must be back on the src/data/eiTech.ts list first.
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
drop table if exists techtrendi.ei_tech_memes;
notify pgrst, 'reload schema';
