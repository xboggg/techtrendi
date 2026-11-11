-- Ei Tech! memes in the database (owner, 11 Nov 2026: "L2" — the Telegram meme desk).
-- Until now the memes were written into src/data/eiTech.ts, so every meme needed a
-- deploy. Now the meme desk (/opt/tech-news/meme_desk.py, service key) adds rows here
-- and a published meme shows on /ei-tech at once. The build also bakes the published
-- list into src/data/eiTechMemes.json (scripts/fetch-ei-tech.mjs) for prerendering.
--   visitors  read published memes only;
--   admins    read everything;
--   writes    only the meme desk (service key, bypasses RLS) or admins.
-- Also: ei_tech_react now only accepts reactions for published memes.
-- Rollback: supabase/migrations/20261111_ei_tech_memes_rollback.sql

create table if not exists techtrendi.ei_tech_memes (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,80}$'),
  title text not null check (length(title) between 1 and 80),
  caption text not null check (length(caption) between 1 and 160),
  alt text not null check (length(alt) between 1 and 400),
  width int not null check (width between 100 and 5000),
  height int not null check (height between 100 and 8000),
  image_jpg text not null check (image_jpg ~ '^/[A-Za-z0-9/_.-]+\.jpg$'),
  image_webp text not null check (image_webp ~ '^/[A-Za-z0-9/_.-]+\.webp$'),
  share_image text not null check (share_image ~ '^/[A-Za-z0-9/_.-]+\.jpg$'),
  vote_a_emoji text, vote_a_label text, vote_b_emoji text, vote_b_label text,
  status text not null default 'draft' check (status in ('draft', 'published', 'binned')),
  published_at timestamptz,
  job_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ei_tech_memes_vote_all_or_none check (
    (vote_a_emoji is null and vote_a_label is null and vote_b_emoji is null and vote_b_label is null)
    or (vote_a_emoji is not null and vote_a_label is not null and vote_b_emoji is not null and vote_b_label is not null
        and length(vote_a_label) <= 30 and length(vote_b_label) <= 30
        and length(vote_a_emoji) <= 16 and length(vote_b_emoji) <= 16)),
  constraint ei_tech_memes_published_has_date check (status <> 'published' or published_at is not null)
);

create index if not exists ei_tech_memes_published_idx on techtrendi.ei_tech_memes (published_at desc) where status = 'published';

alter table techtrendi.ei_tech_memes enable row level security;
drop policy if exists ei_tech_memes_public_read on techtrendi.ei_tech_memes;
create policy ei_tech_memes_public_read on techtrendi.ei_tech_memes for select to anon, authenticated using (status = 'published');
drop policy if exists ei_tech_memes_admin_all on techtrendi.ei_tech_memes;
create policy ei_tech_memes_admin_all on techtrendi.ei_tech_memes for all to authenticated
  using (techtrendi.is_admin()) with check (techtrendi.is_admin());
revoke all on techtrendi.ei_tech_memes from anon, authenticated;
grant select on techtrendi.ei_tech_memes to anon, authenticated;
grant insert, update, delete on techtrendi.ei_tech_memes to authenticated;

-- The first meme, as it is on the site today (pictures ship with the website in public/ei-tech/).
insert into techtrendi.ei_tech_memes (slug, title, caption, alt, width, height, image_jpg, image_webp, share_image,
  vote_a_emoji, vote_a_label, vote_b_emoji, vote_b_label, status, published_at)
values ('iphone-vs-cow', 'iPhone or cow?', 'Same money. Two years later… Ei!',
  'A laughing man at a roadside kiosk wears a T-shirt: an orange iPhone and a cow both cost $1,300. Two years later the iPhone has a cracked screen, and the cow has two calves.',
  1080, 1460, '/ei-tech/iphone-vs-cow.jpg', '/ei-tech/iphone-vs-cow.webp', '/ei-tech/iphone-vs-cow-share.jpg',
  '📱', 'Team iPhone', '🐄', 'Team Cow', 'published', '2026-11-11 11:40:00+00')
on conflict (slug) do nothing;

-- Same as 20261111_ei_tech_reactions.sql, plus: the meme must exist and be published.
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
  if not exists (select 1 from techtrendi.ei_tech_memes m where m.slug = p_slug and m.status = 'published'
                 and (p_kind = 'laugh' or m.vote_a_label is not null)) then return null; end if;

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

revoke all on function techtrendi.ei_tech_react(text, text, text, text) from public;
grant execute on function techtrendi.ei_tech_react(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
