-- Migration: Fix leaderboard functions with SECURITY DEFINER
-- Created: 2025-11-16
-- Description: Adds SECURITY DEFINER and GRANT permissions to leaderboard functions

-- ============================================================================
-- UPDATE FUNCTION: update_leaderboard_entry
-- ============================================================================

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_leaderboard_entry TO authenticated, service_role, anon;

-- ============================================================================
-- UPDATE FUNCTION: calculate_rankings
-- ============================================================================

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_rankings TO authenticated, service_role, anon;

-- ============================================================================
-- UPDATE FUNCTION: archive_leaderboards
-- ============================================================================

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION archive_leaderboards TO authenticated, service_role, anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify that functions have SECURITY DEFINER
SELECT
  proname as function_name,
  prosecdef as security_definer
FROM pg_proc
WHERE proname IN ('update_leaderboard_entry', 'calculate_rankings', 'archive_leaderboards');
