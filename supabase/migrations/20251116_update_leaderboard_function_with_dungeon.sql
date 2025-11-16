-- Migration: Update update_leaderboard_entry function to accept dungeon_name
-- Created: 2025-11-16
-- Description: Adds p_dungeon_name parameter to update_leaderboard_entry function

-- Drop old function signature first to avoid ambiguity
DROP FUNCTION IF EXISTS update_leaderboard_entry(UUID, leaderboard_category, BIGINT, TEXT, INTEGER);

-- Create new function with dungeon_name parameter
CREATE OR REPLACE FUNCTION update_leaderboard_entry(
  p_user_id UUID,
  p_category leaderboard_category,
  p_score BIGINT,
  p_player_name TEXT DEFAULT NULL,
  p_player_level INTEGER DEFAULT 1,
  p_dungeon_name TEXT DEFAULT NULL
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
    player_level,
    dungeon_name
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
    p_player_level,
    p_dungeon_name
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
    -- Update dungeon_name only if new score is better (for deepest_floor category)
    dungeon_name = CASE
      WHEN p_category = 'deepest_floor' AND p_score > daily_leaderboards.score
      THEN COALESCE(p_dungeon_name, daily_leaderboards.dungeon_name)
      ELSE daily_leaderboards.dungeon_name
    END,
    updated_at = NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_leaderboard_entry TO authenticated, service_role, anon;
