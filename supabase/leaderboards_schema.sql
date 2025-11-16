-- Leaderboards Database Schema
--
-- Daily competitive leaderboards for Looters Land
-- Tracks 4 categories: Deepest Floor, Total Gold, Heroes Collected, Combat Power
--
-- @author Roman Hlaváček - rhsoft.cz
-- @copyright 2025
-- @created 2025-11-08

-- ============================================================================
-- LEADERBOARD CATEGORIES
-- ============================================================================

CREATE TYPE leaderboard_category AS ENUM (
  'deepest_floor',
  'total_gold',
  'heroes_collected',
  'combat_power'
);

-- ============================================================================
-- DAILY LEADERBOARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category leaderboard_category NOT NULL,

  -- Metrics
  deepest_floor INTEGER DEFAULT 0,
  total_gold BIGINT DEFAULT 0,
  heroes_collected INTEGER DEFAULT 0,
  combat_power INTEGER DEFAULT 0,

  -- Ranking
  rank INTEGER,
  score BIGINT, -- The actual value used for ranking (depends on category)

  -- Metadata
  player_name TEXT,
  player_level INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one entry per user per day per category
  UNIQUE(user_id, date, category)
);

-- ============================================================================
-- LEADERBOARD ARCHIVE TABLE
-- ============================================================================

-- Store historical leaderboard data after daily reset
CREATE TABLE IF NOT EXISTS daily_leaderboards_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category leaderboard_category NOT NULL,

  -- Top 100 players data (JSON)
  top_players JSONB NOT NULL,

  -- Stats
  total_participants INTEGER,
  highest_score BIGINT,
  average_score BIGINT,

  -- Timestamps
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(date, category)
);

-- ============================================================================
-- PLAYER LEADERBOARD STATS (Cached)
-- ============================================================================

-- Denormalized table for fast leaderboard queries
CREATE TABLE IF NOT EXISTS player_leaderboard_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Current daily stats
  current_deepest_floor INTEGER DEFAULT 0,
  current_total_gold BIGINT DEFAULT 0,
  current_heroes_collected INTEGER DEFAULT 0,
  current_combat_power INTEGER DEFAULT 0,

  -- Best ever stats
  best_deepest_floor INTEGER DEFAULT 0,
  best_total_gold BIGINT DEFAULT 0,
  best_heroes_collected INTEGER DEFAULT 0,
  best_combat_power INTEGER DEFAULT 0,

  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reset_date DATE DEFAULT CURRENT_DATE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for fast ranking queries
CREATE INDEX IF NOT EXISTS idx_daily_leaderboards_date_category_score
ON daily_leaderboards(date, category, score DESC);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_daily_leaderboards_user_date
ON daily_leaderboards(user_id, date);

-- Index for archive queries
CREATE INDEX IF NOT EXISTS idx_daily_leaderboards_archive_date_category
ON daily_leaderboards_archive(date, category);

-- Index for player stats
CREATE INDEX IF NOT EXISTS idx_player_leaderboard_stats_combat_power
ON player_leaderboard_stats(current_combat_power DESC);

-- ============================================================================
-- FUNCTIONS FOR LEADERBOARD MANAGEMENT
-- ============================================================================

-- Function to update player leaderboard entry
CREATE OR REPLACE FUNCTION update_leaderboard_entry(
  p_user_id UUID,
  p_category leaderboard_category,
  p_score BIGINT,
  p_player_name TEXT DEFAULT NULL,
  p_player_level INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deepest_floor INTEGER := 0;
  v_total_gold BIGINT := 0;
  v_heroes_collected INTEGER := 0;
  v_combat_power INTEGER := 0;
BEGIN
  -- Set the appropriate metric based on category
  CASE p_category
    WHEN 'deepest_floor' THEN v_deepest_floor := p_score;
    WHEN 'total_gold' THEN v_total_gold := p_score;
    WHEN 'heroes_collected' THEN v_heroes_collected := p_score;
    WHEN 'combat_power' THEN v_combat_power := p_score;
  END CASE;

  -- Insert or update leaderboard entry
  INSERT INTO daily_leaderboards (
    user_id,
    date,
    category,
    deepest_floor,
    total_gold,
    heroes_collected,
    combat_power,
    score,
    player_name,
    player_level
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    p_category,
    v_deepest_floor,
    v_total_gold,
    v_heroes_collected,
    v_combat_power,
    p_score,
    p_player_name,
    p_player_level
  )
  ON CONFLICT (user_id, date, category) DO UPDATE
  SET
    score = GREATEST(daily_leaderboards.score, p_score),
    deepest_floor = CASE WHEN p_category = 'deepest_floor' THEN GREATEST(daily_leaderboards.deepest_floor, v_deepest_floor) ELSE daily_leaderboards.deepest_floor END,
    total_gold = CASE WHEN p_category = 'total_gold' THEN GREATEST(daily_leaderboards.total_gold, v_total_gold) ELSE daily_leaderboards.total_gold END,
    heroes_collected = CASE WHEN p_category = 'heroes_collected' THEN GREATEST(daily_leaderboards.heroes_collected, v_heroes_collected) ELSE daily_leaderboards.heroes_collected END,
    combat_power = CASE WHEN p_category = 'combat_power' THEN GREATEST(daily_leaderboards.combat_power, v_combat_power) ELSE daily_leaderboards.combat_power END,
    player_name = COALESCE(p_player_name, daily_leaderboards.player_name),
    player_level = COALESCE(p_player_level, daily_leaderboards.player_level),
    updated_at = NOW();
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION update_leaderboard_entry TO authenticated, service_role, anon;

-- Function to calculate rankings for a specific category
CREATE OR REPLACE FUNCTION calculate_rankings(p_date DATE, p_category leaderboard_category)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH ranked_players AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC) AS new_rank
    FROM daily_leaderboards
    WHERE date = p_date AND category = p_category
  )
  UPDATE daily_leaderboards dl
  SET rank = rp.new_rank
  FROM ranked_players rp
  WHERE dl.id = rp.id;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION calculate_rankings TO authenticated, service_role, anon;

-- Function to archive leaderboards for a specific date
CREATE OR REPLACE FUNCTION archive_leaderboards(p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category leaderboard_category;
BEGIN
  FOR v_category IN SELECT unnest(enum_range(NULL::leaderboard_category))
  LOOP
    INSERT INTO daily_leaderboards_archive (
      date,
      category,
      top_players,
      total_participants,
      highest_score,
      average_score
    )
    SELECT
      p_date,
      v_category,
      jsonb_agg(
        jsonb_build_object(
          'rank', rank,
          'player_name', player_name,
          'score', score,
          'player_level', player_level
        ) ORDER BY rank
      ) FILTER (WHERE rank <= 100), -- Top 100 only
      COUNT(*),
      MAX(score),
      AVG(score)::BIGINT
    FROM daily_leaderboards
    WHERE date = p_date AND category = v_category
    ON CONFLICT (date, category) DO NOTHING;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION archive_leaderboards TO authenticated, service_role, anon;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamp on record update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_leaderboards_updated_at
  BEFORE UPDATE ON daily_leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE daily_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_leaderboards_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- Players can view all leaderboard entries
CREATE POLICY "Public leaderboards are viewable by everyone"
  ON daily_leaderboards FOR SELECT
  USING (true);

-- Players can only insert/update their own entries
CREATE POLICY "Users can insert their own leaderboard entries"
  ON daily_leaderboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard entries"
  ON daily_leaderboards FOR UPDATE
  USING (auth.uid() = user_id);

-- Archive is read-only for everyone
CREATE POLICY "Archived leaderboards are viewable by everyone"
  ON daily_leaderboards_archive FOR SELECT
  USING (true);

-- Player stats policies
CREATE POLICY "Users can view all player stats"
  ON player_leaderboard_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own stats"
  ON player_leaderboard_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE daily_leaderboards IS 'Daily competitive leaderboards across 4 categories';
COMMENT ON TABLE daily_leaderboards_archive IS 'Historical leaderboard data for past days';
COMMENT ON TABLE player_leaderboard_stats IS 'Cached leaderboard statistics per player';
COMMENT ON FUNCTION update_leaderboard_entry IS 'Update or insert a player leaderboard entry for a specific category';
COMMENT ON FUNCTION calculate_rankings IS 'Recalculate rankings for a specific date and category';
COMMENT ON FUNCTION archive_leaderboards IS 'Archive leaderboards for a specific date to the archive table';
