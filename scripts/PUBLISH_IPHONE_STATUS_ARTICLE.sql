-- TechTrendi — publish "He Sold His Kidney for an iPhone"
-- Slug: iphone-status-symbol-psychology
-- Run in Supabase SQL Editor (studio.techtrendi.com) or:
--   docker exec -i supabase-db psql -U postgres -d postgres < PUBLISH_IPHONE_STATUS_ARTICLE.sql
--
-- NOTE: content is HTML on purpose. BlogArticle.tsx renderContent() detects HTML
-- tags and passes the body through untouched to DOMPurify, which preserves
-- <table> and class attributes. Markdown pipe tables would NOT render.
--
-- Body text lives in content/articles/iphone-status-symbol-psychology.md
-- (everything between "## Article Content" and "## Internal Linking Opportunities").
-- Paste it into the content field below, between the E'' quotes, escaping any
-- apostrophes as '' (doubled). Easiest path: use the Supabase Studio table editor
-- for the content field and this SQL for everything else.

-- ⚠ SCHEMA IS techtrendi, NOT public. Verified 2026-09-11 against the live DB:
--   src/integrations/supabase/client.ts sets schema: 'techtrendi'
--   PGRST_DB_SCHEMAS=techtrendi,cyberabofra,public,...
--   information_schema shows the table at techtrendi.articles (327 rows)
-- Writing to public.articles would create a phantom table the site never reads.

INSERT INTO techtrendi.articles (
  slug,
  title,
  excerpt,
  content,
  category,
  tags,
  author,
  read_time_minutes,
  is_premium,
  is_published
) VALUES (
  'iphone-status-symbol-psychology',
  'He Sold His Kidney for an iPhone. Fifteen Years Later, We Are Still Telling the Story',
  'A teenager really did sell his kidney for an iPhone in 2011. The story comes back every launch, usually fake. Here is what is true, what is invented, and why a phone has this much power over us.',
  E'<<< PASTE ARTICLE HTML BODY HERE >>>',
  'Phones',
  ARRAY['iPhone 18 Pro Max', 'iPhone price Ghana', 'phone status symbol', 'conspicuous consumption', 'UK used iPhone', 'Apple event 2026'],
  'Edmund A.',
  13,
  false,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  excerpt           = EXCLUDED.excerpt,
  content           = EXCLUDED.content,
  category          = EXCLUDED.category,
  tags              = EXCLUDED.tags,
  read_time_minutes = EXCLUDED.read_time_minutes,
  is_published      = EXCLUDED.is_published,
  updated_at        = NOW();

-- Verify:
-- SELECT slug, title, category, is_published, length(content) FROM techtrendi.articles
--   WHERE slug = 'iphone-status-symbol-psychology';
--
-- Then set the cover image once the feature image is uploaded:
-- UPDATE techtrendi.articles
--   SET cover_image = '/images/articles/iphone-status-symbol-psychology.webp'
--   WHERE slug = 'iphone-status-symbol-psychology';
--
-- Until then it falls back to the "Phones" category Unsplash image automatically
-- (BlogArticle.tsx getArticleImage), so the page will not look broken.
