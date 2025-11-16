-- ============================================================================
-- DIAGNOSTIC SCRIPT FOR DAILY RESET
-- ============================================================================
-- This script helps diagnose issues with the daily-reset edge function
--
-- Run this in Supabase SQL Editor to check:
-- 1. Does reset_daily_data() function exist?
-- 2. Does player_profiles table have required columns?
-- 3. Can we manually run reset_daily_data()?
-- ============================================================================

-- ============================================================================
-- 1. Check if reset_daily_data() function exists
-- ============================================================================

SELECT
  proname as function_name,
  prosecdef as has_security_definer,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'reset_daily_data';

-- Expected: 1 row with function_name = 'reset_daily_data' and has_security_definer = true
-- If empty, the function doesn't exist!

-- ============================================================================
-- 2. Check player_profiles table structure
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'player_profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- - energy (integer)
-- - max_energy (integer)
-- - world_map_data (jsonb)
-- - discovered_locations (jsonb)

-- ============================================================================
-- 3. Check if there are any player_profiles
-- ============================================================================

SELECT COUNT(*) as total_profiles
FROM player_profiles;

-- Expected: At least 1 row (your test account)

-- ============================================================================
-- 4. Try to manually run reset_daily_data()
-- ============================================================================

-- Uncomment to test:
-- SELECT reset_daily_data();

-- If this fails, you'll see the exact error message
-- If it succeeds, you'll see "Query executed successfully"

-- ============================================================================
-- 5. Check function permissions
-- ============================================================================

SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'reset_daily_data';

-- Expected: security_type = 'DEFINER'

-- ============================================================================
-- END OF DIAGNOSTICS
-- ============================================================================
