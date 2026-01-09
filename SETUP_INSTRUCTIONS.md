# TechTrendi Backend Setup Instructions

## 1. Run Database Migration

Go to your Supabase Dashboard:
1. Open https://supabase.com/dashboard
2. Select your project (spjxgoeermsdgrecsxgb)
3. Go to **SQL Editor**
4. Copy the contents of `supabase/migrations/20240109_add_features.sql`
5. Paste and click **Run**

This will create:
- 15 new tables (bookmarks, collections, forum, etc.)
- Row Level Security policies
- Triggers for auto-updates
- Default forum categories

## 2. Deploy Edge Functions

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref spjxgoeermsdgrecsxgb

# Deploy functions
supabase functions deploy send-notification
supabase functions deploy check-price-alerts
supabase functions deploy ai-recommendations
```

## 3. Set Up Cron Job for Price Alerts

In Supabase Dashboard:
1. Go to **Database** > **Extensions**
2. Enable `pg_cron` extension
3. Run this SQL:

```sql
SELECT cron.schedule(
  'check-price-alerts',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://db.techtrendi.com/functions/v1/check-price-alerts',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## 4. Environment Variables for Edge Functions

In Supabase Dashboard > Settings > Edge Functions:
- `SUPABASE_URL`: https://db.techtrendi.com
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
- `SUPABASE_ANON_KEY`: Your anon key

## Tables Created

| Table | Purpose |
|-------|---------|
| bookmarks | User saved content |
| collections | User content collections |
| collection_items | Items in collections |
| reading_history | Track reading progress |
| saved_searches | Saved search queries |
| notifications | In-app notifications |
| forum_categories | Forum sections |
| forum_threads | Discussion threads |
| forum_replies | Thread replies |
| forum_votes | Upvotes/downvotes |
| price_history | Product price tracking |
| price_alerts | User price alerts |
| user_preferences | User settings |
| article_reactions | Article reactions |
| newsletter_subscriptions | Email subscriptions |
