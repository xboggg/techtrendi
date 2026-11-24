-- Rollback for 20261124_image_attribution.sql. Removes the cover-picture labels and credits.
-- The site code treats missing fields as "no label", so pages keep working after this.
drop trigger if exists trg_news_image_source on techtrendi.news;
drop trigger if exists trg_articles_image_source on techtrendi.articles;
drop function if exists techtrendi.fill_image_source();
drop function if exists techtrendi.image_source_guess(text);
alter table techtrendi.news drop constraint if exists news_image_source_type_check;
alter table techtrendi.articles drop constraint if exists articles_image_source_type_check;
alter table techtrendi.news
  drop column if exists image_source_type, drop column if exists image_credit,
  drop column if exists image_caption, drop column if exists image_source_auto;
alter table techtrendi.articles
  drop column if exists image_source_type, drop column if exists image_credit,
  drop column if exists image_caption, drop column if exists image_source_auto;
