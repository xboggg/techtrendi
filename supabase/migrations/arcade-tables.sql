-- ═══════════════════════════════════════════════════════════════════════════
-- TechTrendi Gaming Arcade — Database Schema
-- Schema: techtrendi
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. arcade_players — Anonymous player profiles
CREATE TABLE IF NOT EXISTS techtrendi.arcade_players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Player',
  elo_rating INTEGER NOT NULL DEFAULT 800,
  rank_tier TEXT NOT NULL DEFAULT 'bronze'
    CHECK (rank_tier IN ('bronze', 'silver', 'gold', 'diamond', 'legend')),
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION techtrendi.arcade_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS arcade_players_updated_at_trigger ON techtrendi.arcade_players;
CREATE TRIGGER arcade_players_updated_at_trigger
  BEFORE UPDATE ON techtrendi.arcade_players
  FOR EACH ROW EXECUTE FUNCTION techtrendi.arcade_players_updated_at();

-- 2. arcade_game_stats — Per-game stats for each player
CREATE TABLE IF NOT EXISTS techtrendi.arcade_game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES techtrendi.arcade_players(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  elo_rating INTEGER NOT NULL DEFAULT 800,
  rank_tier TEXT NOT NULL DEFAULT 'bronze'
    CHECK (rank_tier IN ('bronze', 'silver', 'gold', 'diamond', 'legend')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, game_slug)
);

CREATE INDEX IF NOT EXISTS idx_arcade_game_stats_player
  ON techtrendi.arcade_game_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_arcade_game_stats_game
  ON techtrendi.arcade_game_stats(game_slug);

-- 3. arcade_leaderboard — Score entries
CREATE TABLE IF NOT EXISTS techtrendi.arcade_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL DEFAULT 'Player',
  game_slug TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  game_mode TEXT NOT NULL DEFAULT 'solo',
  rank_tier TEXT DEFAULT 'bronze',
  elo_rating INTEGER DEFAULT 800,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arcade_leaderboard_game_score
  ON techtrendi.arcade_leaderboard(game_slug, score DESC);
CREATE INDEX IF NOT EXISTS idx_arcade_leaderboard_created
  ON techtrendi.arcade_leaderboard(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arcade_leaderboard_player
  ON techtrendi.arcade_leaderboard(player_id);

-- 4. arcade_daily_challenges — One challenge per game per day
CREATE TABLE IF NOT EXISTS techtrendi.arcade_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug TEXT NOT NULL,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  seed INTEGER NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_slug, challenge_date)
);

CREATE INDEX IF NOT EXISTS idx_arcade_daily_challenges_date
  ON techtrendi.arcade_daily_challenges(challenge_date DESC);

-- 5. arcade_daily_scores — Scores for daily challenges
CREATE TABLE IF NOT EXISTS techtrendi.arcade_daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES techtrendi.arcade_daily_challenges(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_arcade_daily_scores_challenge
  ON techtrendi.arcade_daily_scores(challenge_id, score DESC);

-- 6. arcade_rooms — Online multiplayer rooms
CREATE TABLE IF NOT EXISTS techtrendi.arcade_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  host_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INTEGER NOT NULL DEFAULT 2,
  current_players INTEGER NOT NULL DEFAULT 1,
  config JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arcade_rooms_code
  ON techtrendi.arcade_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_arcade_rooms_status
  ON techtrendi.arcade_rooms(status) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_arcade_rooms_expires
  ON techtrendi.arcade_rooms(expires_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security — Allow anonymous access (no auth required)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE techtrendi.arcade_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE techtrendi.arcade_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE techtrendi.arcade_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE techtrendi.arcade_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE techtrendi.arcade_daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE techtrendi.arcade_rooms ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations for anonymous users (arcade is public)
CREATE POLICY "arcade_players_all" ON techtrendi.arcade_players
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "arcade_game_stats_all" ON techtrendi.arcade_game_stats
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "arcade_leaderboard_all" ON techtrendi.arcade_leaderboard
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "arcade_daily_challenges_all" ON techtrendi.arcade_daily_challenges
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "arcade_daily_scores_all" ON techtrendi.arcade_daily_scores
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "arcade_rooms_all" ON techtrendi.arcade_rooms
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- Done! All 6 arcade tables created with indexes and RLS policies.
-- ═══════════════════════════════════════════════════════════════════════════
