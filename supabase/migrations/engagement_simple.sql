-- TechTrendi Engagement Features - Simplified Version
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE PROFILES TABLE FOR GAMIFICATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  total_articles_read INT DEFAULT 0,
  total_comments INT DEFAULT 0,
  login_streak INT DEFAULT 0,
  last_streak_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. COMMENTS SYSTEM
-- ============================================

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

CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id);

-- ============================================
-- 3. ARTICLE REACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.article_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('helpful', 'love', 'fire', 'insightful', 'mindblown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_article_id ON public.article_reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.article_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON public.article_reactions(reaction_type);

-- ============================================
-- 4. BOOKMARKS
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  collection_name TEXT DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article ON public.bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection ON public.bookmarks(user_id, collection_name);

-- ============================================
-- 5. BADGES
-- ============================================

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

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON public.user_badges(earned_at DESC);

-- ============================================
-- 6. USER ACTIVITY
-- ============================================

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

-- ============================================
-- 7. NEWSLETTER
-- ============================================

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

-- ============================================
-- 8. ARTICLE SHARES
-- ============================================

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
-- 9. READING HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed BOOLEAN DEFAULT false,
  time_spent_seconds INT DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_history_user ON public.reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_article ON public.reading_history(article_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_last_read ON public.reading_history(last_read_at DESC);

-- ============================================
-- 10. INSERT DEFAULT BADGES
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
-- 11. FUNCTIONS
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
-- 12. ROW LEVEL SECURITY
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

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.article_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.article_reactions;
DROP POLICY IF EXISTS "Users can remove their reactions" ON public.article_reactions;
DROP POLICY IF EXISTS "Users can view their bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can create bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can update their bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Anyone can view user badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view their reading history" ON public.reading_history;
DROP POLICY IF EXISTS "Users can update their reading history" ON public.reading_history;
DROP POLICY IF EXISTS "Users can update reading progress" ON public.reading_history;
DROP POLICY IF EXISTS "Anyone can view share counts" ON public.article_shares;
DROP POLICY IF EXISTS "Users can log shares" ON public.article_shares;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reactions" ON public.article_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.article_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their reactions" ON public.article_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their bookmarks" ON public.bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view user badges" ON public.user_badges FOR SELECT USING (true);

CREATE POLICY "Users can view their reading history" ON public.reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their reading history" ON public.reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update reading progress" ON public.reading_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view share counts" ON public.article_shares FOR SELECT USING (true);
CREATE POLICY "Users can log shares" ON public.article_shares FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);