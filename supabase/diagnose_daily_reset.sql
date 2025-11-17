-- ============================================================================
-- DIAGNOSTIC QUERIES FOR DAILY RESET SYSTEM
-- ============================================================================
--
-- Run these queries in Supabase SQL Editor to diagnose daily reset issues
--
-- ============================================================================

-- ============================================================================
-- 1. CHECK IF NEW FUNCTIONS ARE DEPLOYED
-- ============================================================================

SELECT '=== CHECKING FUNCTIONS ===' AS check_section;

SELECT
  p.proname AS function_name,
  CASE
    WHEN p.proname = 'calculate_bank_energy_bonus' THEN 'Helper function for energy calculation'
    WHEN p.proname = 'reset_daily_data' THEN 'Main daily reset function'
  END AS description,
  'EXISTS' AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('calculate_bank_energy_bonus', 'reset_daily_data');

-- ============================================================================
-- 2. TEST ENERGY BONUS CALCULATION
-- ============================================================================

SELECT '=== TESTING ENERGY BONUS FUNCTION ===' AS check_section;

SELECT
  tier,
  calculate_bank_energy_bonus(tier) AS energy_bonus,
  240 + calculate_bank_energy_bonus(tier) AS total_max_energy
FROM (
  VALUES (0), (1), (2), (3), (4), (5)
) AS tiers(tier);

-- ============================================================================
-- 3. CHECK CRON JOB CONFIGURATION
-- ============================================================================

SELECT '=== CRON JOB CONFIGURATION ===' AS check_section;

SELECT
  jobid,
  jobname,
  schedule,
  CASE
    WHEN schedule = '0 0 * * *' THEN '✓ Correct (midnight UTC = 01:00 Czech)'
    ELSE '✗ WRONG SCHEDULE'
  END AS schedule_check,
  active,
  CASE
    WHEN active THEN '✓ Active'
    ELSE '✗ INACTIVE'
  END AS active_check,
  database
FROM cron.job
WHERE jobname = 'daily-reset-trigger';

-- ============================================================================
-- 4. CHECK RECENT CRON JOB EXECUTIONS
-- ============================================================================

SELECT '=== RECENT CRON EXECUTIONS (Czech Time) ===' AS check_section;

SELECT
  j.jobname,
  jr.status,
  CASE
    WHEN jr.status = 'succeeded' THEN '✓ Success'
    WHEN jr.status = 'failed' THEN '✗ FAILED'
    ELSE jr.status
  END AS status_check,
  jr.return_message,
  jr.start_time AT TIME ZONE 'Europe/Prague' AS start_time_czech,
  jr.end_time AT TIME ZONE 'Europe/Prague' AS end_time_czech,
  ROUND(EXTRACT(EPOCH FROM (jr.end_time - jr.start_time))::NUMERIC, 2) AS duration_seconds
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'daily-reset-trigger'
ORDER BY jr.start_time DESC
LIMIT 10;

-- ============================================================================
-- 5. CHECK CURRENT PLAYER PROFILES STATE
-- ============================================================================

SELECT '=== CURRENT PLAYER PROFILES ===' AS check_section;

SELECT
  user_id,
  energy AS current_energy,
  max_energy AS cached_max_energy,
  bank_vault_tier,
  calculate_bank_energy_bonus(COALESCE(bank_vault_tier, 0)) AS calculated_bonus,
  240 + calculate_bank_energy_bonus(COALESCE(bank_vault_tier, 0)) AS correct_max_energy,
  CASE
    WHEN energy = 240 + calculate_bank_energy_bonus(COALESCE(bank_vault_tier, 0))
    THEN '✓ Energy is correct'
    ELSE '✗ Energy needs reset'
  END AS energy_check,
  CASE
    WHEN world_map_data IS NULL THEN '✓ Map cleared (will regenerate)'
    ELSE '✗ Map not cleared'
  END AS map_check,
  jsonb_array_length(discovered_locations) AS locations_count,
  updated_at AT TIME ZONE 'Europe/Prague' AS last_updated_czech
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- 6. CHECK WHEN NEXT RESET SHOULD OCCUR
-- ============================================================================

SELECT '=== NEXT SCHEDULED RESET ===' AS check_section;

SELECT
  NOW() AT TIME ZONE 'UTC' AS current_time_utc,
  NOW() AT TIME ZONE 'Europe/Prague' AS current_time_czech,
  DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day' AS next_reset_utc,
  (DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day') AT TIME ZONE 'Europe/Prague' AS next_reset_czech,
  EXTRACT(EPOCH FROM (DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day' - NOW() AT TIME ZONE 'UTC'))/3600 AS hours_until_reset;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

SELECT '=== INTERPRETATION GUIDE ===' AS guide;

SELECT
  'Check results above:' AS step,
  '1. Both functions should exist' AS functions_check,
  '2. Energy bonuses should match: 0, 25, 50, 75, 100, 125' AS bonus_check,
  '3. Cron job should be active with schedule "0 0 * * *"' AS cron_check,
  '4. Recent executions should show "succeeded" status' AS execution_check,
  '5. Player profiles should have correct max energy' AS profile_check,
  '6. Map should be NULL after reset (will regenerate on game load)' AS map_check;

-- ============================================================================
-- MANUAL TEST (OPTIONAL - UNCOMMENT TO RUN)
-- ============================================================================

-- WARNING: This will immediately reset all player profiles!
-- Only use for testing purposes.

-- SELECT '=== MANUAL TEST ===' AS test_section;
-- SELECT reset_daily_data();
-- SELECT 'Manual reset completed - check profiles above' AS result;

-- ============================================================================
