-- ═══════════════════════════════════════════════════════════════
-- Scam Stories Migration
-- "Share Your Story" — user-submitted personal scam experiences
-- (text/photo/video), community scrapbook board on /security, with
-- admin moderation before anything goes public. Distinct from the
-- existing security_scam_reports pipeline (which reports a scam
-- PATTERN to warn others) — this is personal first-person narrative
-- content meant to be read, filtered, and reacted to.
--
-- IMPORTANT: this self-hosted instance exposes the "techtrendi" schema
-- as PostgREST's default/primary schema (PGRST_DB_SCHEMAS=techtrendi,...),
-- NOT "public" — every other security_* table lives there. Tables and
-- functions must be created in techtrendi explicitly or the REST API
-- returns 404 "Could not find the table" even though it exists in public.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS techtrendi.security_scam_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_text TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'none', -- 'none', 'photo', 'video'
  name_or_alias TEXT NOT NULL, -- required; visitor may literally type "Anonymous"
  country TEXT NOT NULL DEFAULT 'Ghana',
  region TEXT NOT NULL, -- one of Ghana's 16 regions, or free text if country != Ghana
  scam_category TEXT NOT NULL, -- 'giveaway', 'rental', 'job_offer', 'romance', 'mobile_money', 'delivery', 'boss_fraud', 'investment', 'phishing_link', 'other'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_note TEXT, -- private, never shown publicly
  reaction_count INTEGER NOT NULL DEFAULT 0,
  submitter_ip_hash TEXT, -- optional coarse abuse signal, never displayed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scam_stories_status ON techtrendi.security_scam_stories(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scam_stories_region ON techtrendi.security_scam_stories(region) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_scam_stories_category ON techtrendi.security_scam_stories(scam_category) WHERE status = 'approved';

ALTER TABLE techtrendi.security_scam_stories ENABLE ROW LEVEL SECURITY;

-- Public can read only approved stories
CREATE POLICY "Anyone can read approved stories" ON techtrendi.security_scam_stories FOR SELECT USING (status = 'approved');

-- Anyone can submit a story (goes in as 'pending', invisible until approved)
CREATE POLICY "Anyone can submit a story" ON techtrendi.security_scam_stories FOR INSERT WITH CHECK (status = 'pending');

-- Admin full access — scoped explicitly TO authenticated (not anon).
-- IMPORTANT: a bare "FOR ALL USING (true)" with no role restriction (the
-- pattern found already in use on security_scam_alerts) is combined with
-- OR against every other policy on the same command, so it silently
-- overrides the "approved only" SELECT policy above for anon too — this
-- table actually needs pending/rejected stories to stay hidden from the
-- public, so the role restriction here is required, not optional.
CREATE POLICY "Auth users can manage security_scam_stories" ON techtrendi.security_scam_stories FOR ALL TO authenticated USING (true);

-- This instance grants full table-level privileges to anon/authenticated and
-- relies entirely on the RLS policies above to actually restrict access
-- (confirmed by checking the grants on the existing security_scam_alerts
-- table) — without this GRANT, PostgREST returns 401 "permission denied"
-- before RLS is even evaluated.
GRANT SELECT, INSERT, UPDATE, DELETE ON techtrendi.security_scam_stories TO anon, authenticated;

-- Reactions go through this SECURITY DEFINER function instead of a public
-- UPDATE policy, so a client can only ever bump reaction_count by 1 on an
-- approved story — never rewrite story_text, name_or_alias, or any other
-- field on someone else's row.
CREATE OR REPLACE FUNCTION techtrendi.increment_story_reaction(story_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = techtrendi
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE techtrendi.security_scam_stories
  SET reaction_count = reaction_count + 1
  WHERE id = story_id AND status = 'approved'
  RETURNING reaction_count INTO new_count;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION techtrendi.increment_story_reaction(UUID) TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Storage bucket for story photos/videos
-- ═══════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scam-stories',
  'scam-stories',
  true,
  52428800, -- 50MB — enough for a short phone video clip
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone (no login) can upload into this bucket — the public submission
-- form has no auth, matching the "no signup needed" design of every other
-- tool on the page. Files land in storage immediately, but the STORY ROW
-- referencing them stays invisible (status='pending') until an admin
-- approves it, so an uploaded file with no approved story is harmless.
CREATE POLICY "Anyone can upload story media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'scam-stories');

CREATE POLICY "Anyone can view story media" ON storage.objects FOR SELECT
  USING (bucket_id = 'scam-stories');
