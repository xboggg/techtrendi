-- Feature-image attribution for News (techtrendi.news) and Blog (techtrendi.articles).
-- Owner request 24 Nov 2026: say where each cover picture comes from (AI Illustration,
-- Stock Photo, Courtesy, ...), shown as a small label on the picture plus a credit/caption
-- line under it. The picture file itself is never changed.
--
-- How the label gets there:
--   * Every writer (the automatic news/blog scripts, the Telegram buttons, the admin panel)
--     saves into these two tables, so a trigger works out the label from the cover's
--     filename, which our own pipelines set reliably:
--        /images/news/ghana-tech-ai-*      -> AI Illustration   (cover_picker.py AI picture)
--        /images/news/ghana-tech-px<id>.*  -> Stock Photo, Pexels
--        https://images.pexels.com/...     -> Stock Photo, Pexels
--        https://images.unsplash.com/...   -> Stock Photo, Unsplash
--     Anything else (owner uploads, cards, old pictures) stays NOT SET = no label, and the
--     admin list flags it for review. Nothing is guessed.
--   * Admin panel saves (role "authenticated") are kept exactly as sent; "Automatic" (NULL)
--     means "work it out from the filename". A chosen label has image_source_auto = false.
--   * When a SCRIPT changes the cover without choosing a label, the label is worked out
--     again for the new picture and the old picture's credit and caption are dropped
--     (they describe a picture, not an article).
-- Additive only. Rollback: 20261124_image_attribution_rollback.sql

alter table techtrendi.news
  add column if not exists image_source_type text,
  add column if not exists image_credit text,
  add column if not exists image_caption text,
  add column if not exists image_source_auto boolean not null default false;

alter table techtrendi.articles
  add column if not exists image_source_type text,
  add column if not exists image_credit text,
  add column if not exists image_caption text,
  add column if not exists image_source_auto boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'news_image_source_type_check') then
    alter table techtrendi.news add constraint news_image_source_type_check check (image_source_type in
      ('ai_illustration', 'photo_illustration', 'file_photo', 'stock_photo', 'courtesy', 'none'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'articles_image_source_type_check') then
    alter table techtrendi.articles add constraint articles_image_source_type_check check (image_source_type in
      ('ai_illustration', 'photo_illustration', 'file_photo', 'stock_photo', 'courtesy', 'none'));
  end if;
end $$;

-- What a cover URL reliably tells us. NULLs when it tells us nothing.
create or replace function techtrendi.image_source_guess(url text, out source_type text, out credit text)
language sql
immutable
as $$
  select
    case
      when url ~ '/ghana-tech-ai-[^/]*$' then 'ai_illustration'
      when url ~ '/ghana-tech-px[0-9]+\.[a-z]+$' or url ~ '^https?://images\.pexels\.com/' then 'stock_photo'
      when url ~ '^https?://(images|source)\.unsplash\.com/' then 'stock_photo'
    end,
    case
      when url ~ '/ghana-tech-px[0-9]+\.[a-z]+$' or url ~ '^https?://images\.pexels\.com/' then 'Pexels'
      when url ~ '^https?://(images|source)\.unsplash\.com/' then 'Unsplash'
    end
$$;

create or replace function techtrendi.fill_image_source()
returns trigger
language plpgsql
as $$
declare
  g record;
begin
  if tg_op = 'INSERT' then
    if new.image_source_type is null and new.cover_image is not null then
      g := techtrendi.image_source_guess(new.cover_image);
      if g.source_type is not null then
        new.image_source_type := g.source_type;
        new.image_source_auto := true;
        new.image_credit := coalesce(nullif(new.image_credit, ''), g.credit);
      end if;
    end if;
    return new;
  end if;

  -- UPDATE from the admin panel (a signed-in admin through the API). The admin form always
  -- sends all three fields; "Automatic" is sent as NULL. Its values are kept as sent.
  if coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and (current_setting('request.jwt.claims', true)::json ->> 'role') = 'authenticated' then
    if new.image_source_type is null then
      g := techtrendi.image_source_guess(new.cover_image);
      new.image_source_type := g.source_type;
      new.image_source_auto := g.source_type is not null;
      -- Empty credit, or the OLD picture's automatic credit sent back unchanged after the
      -- picture was swapped (Codex review, PR #69): use the new picture's credit.
      if coalesce(new.image_credit, '') = ''
         or (new.cover_image is distinct from old.cover_image and old.image_source_auto
             and new.image_credit is not distinct from old.image_credit) then
        new.image_credit := g.credit;
      end if;
    else
      new.image_source_auto := false;
    end if;
    return new;
  end if;

  -- UPDATE from a script (service key / psql). It chose a label: keep it as a human choice.
  if new.image_source_type is distinct from old.image_source_type then
    if new.image_source_auto is not distinct from old.image_source_auto then
      new.image_source_auto := false;
    end if;
    return new;
  end if;

  -- A script changed the picture (e.g. a Telegram "new picture" button) without choosing a
  -- label: work the label out again, and drop the OLD picture's credit and caption unless
  -- this same update set new ones.
  if new.cover_image is distinct from old.cover_image then
    g := techtrendi.image_source_guess(new.cover_image);
    new.image_source_type := g.source_type;
    new.image_source_auto := g.source_type is not null;
    if new.image_credit is not distinct from old.image_credit then
      new.image_credit := g.credit;
    end if;
    if new.image_caption is not distinct from old.image_caption then
      new.image_caption := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_news_image_source on techtrendi.news;
create trigger trg_news_image_source
  before insert or update of cover_image, image_source_type, image_source_auto, image_credit on techtrendi.news
  for each row execute function techtrendi.fill_image_source();

drop trigger if exists trg_articles_image_source on techtrendi.articles;
create trigger trg_articles_image_source
  before insert or update of cover_image, image_source_type, image_source_auto, image_credit on techtrendi.articles
  for each row execute function techtrendi.fill_image_source();

-- Existing rows: label ONLY covers whose filename reliably says where they came from.
-- Direct column update; the trigger leaves it alone because image_source_type changes
-- and image_source_auto is set explicitly in the same statement.
update techtrendi.news n
   set image_source_type = g.source_type, image_source_auto = true,
       image_credit = coalesce(nullif(n.image_credit, ''), g.credit)
  from (select id, (techtrendi.image_source_guess(cover_image)).* from techtrendi.news) g
 where g.id = n.id and n.image_source_type is null and g.source_type is not null;

update techtrendi.articles a
   set image_source_type = g.source_type, image_source_auto = true,
       image_credit = coalesce(nullif(a.image_credit, ''), g.credit)
  from (select id, (techtrendi.image_source_guess(cover_image)).* from techtrendi.articles) g
 where g.id = a.id and a.image_source_type is null and g.source_type is not null;
