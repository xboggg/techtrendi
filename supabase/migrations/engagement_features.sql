-- TechTrendi Engagement Features Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. COMMENTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Comment likes junction table
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- ============================================
-- 2. ARTICLE REACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS article_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('helpful', 'love', 'fire', 'insightful', 'mindblown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_article_id ON article_reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON article_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON article_reactions(reaction_type);

-- ============================================
-- 3. BOOKMARKS & READING LISTS
-- ============================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  collection_name TEXT DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article ON bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection ON bookmarks(user_id, collection_name);

-- ============================================
-- 4. GAMIFICATION SYSTEM
-- ============================================

-- Add XP and level to users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='xp') THEN
    ALTER TABLE users ADD COLUMN xp INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='level') THEN
    ALTER TABLE users ADD COLUMN level INT DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_articles_read') THEN
    ALTER TABLE users ADD COLUMN total_articles_read INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_comments') THEN
    ALTER TABLE users ADD COLUMN total_comments INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='login_streak') THEN
    ALTER TABLE users ADD COLUMN login_streak INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_streak_date') THEN
    ALTER TABLE users ADD COLUMN last_streak_date DATE;
  END IF;
END $$;

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
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

-- User badges (achievements earned)
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON user_badges(earned_at DESC);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('read', 'comment', 'share', 'bookmark', 'login', 'tool_use', 'reaction')),
  article_id TEXT,
  xp_earned INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity(created_at DESC);

-- ============================================
-- 5. NEWSLETTER SUBSCRIBERS
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{"frequency": "weekly", "categories": []}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

-- ============================================
-- 6. SOCIAL SHARING ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS article_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'whatsapp', 'copy_link', 'web_share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_article ON article_shares(article_id);
CREATE INDEX IF NOT EXISTS idx_shares_platform ON article_shares(platform);
CREATE INDEX IF NOT EXISTS idx_shares_created ON article_shares(created_at DESC);

-- ============================================
-- 7. READING HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed BOOLEAN DEFAULT false,
  time_spent_seconds INT DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_article ON reading_history(article_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_last_read ON reading_history(last_read_at DESC);

-- ============================================
-- 8. INSERT DEFAULT BADGES
-- ============================================

INSERT INTO badges (id, name, description, icon, xp_reward, requirement_type, requirement_value, tier) VALUES
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
-- 9. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE comments SET likes = likes + 1 WHERE id = NEW.comment_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE comments SET likes = likes - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_likes
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Function to calculate user level from XP
CREATE OR REPLACE FUNCTION calculate_level(user_xp INT)
RETURNS INT AS $$
BEGIN
  -- Level formula: level = floor(sqrt(xp / 100)) + 1
  RETURN FLOOR(SQRT(user_xp::FLOAT / 100)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award XP and update level
CREATE OR REPLACE FUNCTION award_xp(user_uuid UUID, xp_amount INT)
RETURNS VOID AS $$
DECLARE
  new_xp INT;
  new_level INT;
BEGIN
  -- Update XP
  UPDATE users
  SET xp = xp + xp_amount,
      updated_at = NOW()
  WHERE id = user_uuid
  RETURNING xp INTO new_xp;

  -- Calculate and update level
  new_level := calculate_level(new_xp);
  UPDATE users SET level = new_level WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  badge_record RECORD;
  user_stats RECORD;
BEGIN
  -- Get user stats
  SELECT
    total_articles_read,
    total_comments,
    login_streak,
    level,
    (SELECT COUNT(*) FROM bookmarks WHERE user_id = user_uuid) as bookmark_count,
    (SELECT COUNT(*) FROM article_shares WHERE user_id = user_uuid) as share_count,
    (SELECT COUNT(*) FROM user_activity WHERE user_id = user_uuid AND activity_type = 'tool_use') as tool_use_count
  INTO user_stats
  FROM users
  WHERE id = user_uuid;

  -- Check each badge requirement
  FOR badge_record IN SELECT * FROM badges LOOP
    -- Skip if user already has this badge
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_id = badge_record.id) THEN
      CONTINUE;
    END IF;

    -- Check requirement
    IF (badge_record.requirement_type = 'comment_count' AND user_stats.total_comments >= badge_record.requirement_value) OR
       (badge_record.requirement_type = 'article_read_count' AND user_stats.total_articles_read >= badge_record.requirement_value) OR
       (badge_record.requirement_type = 'streak_days' AND user_stats.login_streak >= badge_record.requirement_value) OR
       (badge_record.requirement_type = 'bookmark_count' AND user_stats.bookmark_count >= badge_record.requirement_value) OR
       (badge_record.requirement_type = 'share_count' AND user_stats.share_count >= badge_record.requirement_value) OR
       (badge_record.requirement_type = 'tool_use_count' AND user_stats.tool_use_count >= badge_record.requirement_value) OR
       (badge_record.requirement_type = 'level_reached' AND user_stats.level >= badge_record.requirement_value) THEN

      -- Award badge
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES (user_uuid, badge_record.id, NOW())
      ON CONFLICT DO NOTHING;

      -- Award XP
      PERFORM award_xp(user_uuid, badge_record.xp_reward);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_shares ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Anyone can view comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Anyone can view reactions" ON article_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON article_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their reactions" ON article_reactions FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their bookmarks" ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- User badges policies
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);

-- Reading history policies
CREATE POLICY "Users can view their reading history" ON reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their reading history" ON reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update reading progress" ON reading_history FOR UPDATE USING (auth.uid() = user_id);

-- Article shares policies
CREATE POLICY "Anyone can view share counts" ON article_shares FOR SELECT USING (true);
CREATE POLICY "Users can log shares" ON article_shares FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

COMMENT ON TABLE comments IS 'Threaded comments system for articles';
COMMENT ON TABLE article_reactions IS 'Quick reactions (like, love, fire, etc.) for articles';
COMMENT ON TABLE bookmarks IS 'User bookmarks and reading lists';
COMMENT ON TABLE badges IS 'Achievement badges definition';
COMMENT ON TABLE user_badges IS 'Badges earned by users';
COMMENT ON TABLE user_activity IS 'User engagement activity log for XP tracking';
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter subscription management';
COMMENT ON TABLE article_shares IS 'Social sharing analytics';
COMMENT ON TABLE reading_history IS 'Track article reading progress and history';
