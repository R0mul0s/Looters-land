-- Diagnostic: Check if update_leaderboard_entry RPC function exists

-- 1. Check if function exists
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'update_leaderboard_entry';

-- 2. Test calling the function manually
-- SELECT update_leaderboard_entry(
--   'b4a3f5fd-28ca-4817-82e6-0274b5a63bfe'::uuid,
--   'total_gold'::leaderboard_category,
--   5000::bigint,
--   'Test Player'::text,
--   1::integer
-- );

-- 3. Check all leaderboard entries
SELECT
  category,
  score,
  player_name,
  total_gold,
  heroes_collected,
  combat_power,
  deepest_floor
FROM daily_leaderboards
WHERE date = CURRENT_DATE
ORDER BY category, score DESC;
