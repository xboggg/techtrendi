-- Complete the Engagement Features Migration
-- Only creates what's missing

-- ============================================
-- 1. MISSING TABLES
-- ============================================

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Comment likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id);

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INT DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INT NOT NULL,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON public.user_badges(earned_at DESC);

-- User activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('read', 'comment', 'share', 'bookmark', 'login', 'tool_use', 'reaction')),
  article_id TEXT,
  xp_earned INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.user_activity(created_at DESC);

-- Newsletter table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{"frequency": "weekly", "categories": []}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON public.newsletter_subscribers(status);

-- Article shares table
CREATE TABLE IF NOT EXISTS public.article_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'whatsapp', 'copy_link', 'web_share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_article ON public.article_shares(article_id);
CREATE INDEX IF NOT EXISTS idx_shares_platform ON public.article_shares(platform);
CREATE INDEX IF NOT EXISTS idx_shares_created ON public.article_shares(created_at DESC);

-- ============================================
-- 2. INSERT BADGES
-- ============================================

INSERT INTO public.badges (id, name, description, icon, xp_reward, requirement_type, requirement_value, tier) VALUES
  ('first_comment', 'First Comment', 'Posted your first comment', '💬', 50, 'comment_count', 1, 'bronze'),
  ('tech_savvy', 'Tech Savvy', 'Read 100 articles', '📚', 200, 'article_read_count', 100, 'silver'),
  ('tool_master', 'Tool Master', 'Used all free tools', '🛠️', 100, 'tool_use_count', 3, 'silver'),
  ('security_guru', 'Security Guru', 'Read 10 security articles', '🔒', 150, 'category_read_count', 10, 'gold'),
  ('early_bird', 'Early Bird', '7-day login streak', '🐦', 100, 'streak_days', 7, 'silver'),
  ('sharer', 'Sharer', 'Shared 10 articles', '📢', 80, 'share_count', 10, 'bronze'),
  ('bookworm', 'Bookworm', '50 articles bookmarked', '🔖', 120, 'bookmark_count', 50, 'silver'),
  ('engaged', 'Engaged Reader', '50 comments posted', '💭', 250, 'comment_count', 50, 'gold'),
  ('power_user', 'Power User', 'Reached level 10', '⚡', 500, 'level_reached', 10, 'platinum'),
  ('legend', 'Legend', 'Reached level 25', '👑', 1000, 'level_reached', 25, 'diamond')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_level(user_xp INT)
RETURNS INT AS $$
BEGIN
  RETURN FLOOR(SQRT(user_xp::FLOAT / 100)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.award_xp(user_uuid UUID, xp_amount INT)
RETURNS VOID AS $$
DECLARE
  new_xp INT;
  new_level INT;
BEGIN
  INSERT INTO public.profiles (id, xp, level)
  VALUES (user_uuid, 0, 1)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.profiles
  SET xp = xp + xp_amount, updated_at = NOW()
  WHERE id = user_uuid
  RETURNING xp INTO new_xp;

  new_level := public.calculate_level(new_xp);
  UPDATE public.profiles SET level = new_level WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.comments SET likes = likes + 1 WHERE id = NEW.comment_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.comments SET likes = likes - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes ON public.comment_likes;
CREATE TRIGGER trigger_update_comment_likes
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_update" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;
DROP POLICY IF EXISTS "comment_likes_select" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_insert" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_delete" ON public.comment_likes;
DROP POLICY IF EXISTS "reactions_select" ON public.article_reactions;
DROP POLICY IF EXISTS "reactions_insert" ON public.article_reactions;
DROP POLICY IF EXISTS "reactions_delete" ON public.article_reactions;
DROP POLICY IF EXISTS "bookmarks_select" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_update" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete" ON public.bookmarks;
DROP POLICY IF EXISTS "badges_select" ON public.user_badges;
DROP POLICY IF EXISTS "history_select" ON public.reading_history;
DROP POLICY IF EXISTS "history_insert" ON public.reading_history;
DROP POLICY IF EXISTS "history_update" ON public.reading_history;
DROP POLICY IF EXISTS "shares_select" ON public.article_shares;
DROP POLICY IF EXISTS "shares_insert" ON public.article_shares;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "comment_likes_select" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "comment_likes_insert" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_likes_delete" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "reactions_select" ON public.article_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON public.article_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON public.article_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_select" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_update" ON public.bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "badges_select" ON public.user_badges FOR SELECT USING (true);

CREATE POLICY "history_select" ON public.reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "history_insert" ON public.reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "history_update" ON public.reading_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "shares_select" ON public.article_shares FOR SELECT USING (true);
CREATE POLICY "shares_insert" ON public.article_shares FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

SELECT 'Migration completed successfully!' as status;