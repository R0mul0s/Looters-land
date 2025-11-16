-- ============================================================================
-- MANUAL SETUP FOR DAILY RESET SYSTEM
-- ============================================================================
--
-- This script sets up the complete daily reset system:
-- 1. Creates the reset_daily_data() function
-- 2. Sets up the cron job to run at midnight UTC
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ykkjdsciiztoeqycxmtg
-- 2. Go to SQL Editor
-- 3. Paste this entire script
-- 4. Click "Run"
--
-- @author Roman Hlaváček - rhsoft.cz
-- @copyright 2025
-- @created 2025-11-10
-- ============================================================================

-- ============================================================================
-- PART 1: Create helper function for bank energy bonus calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bank_energy_bonus(tier INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Bank energy bonus tiers (matches BALANCE_CONFIG.ts)
  CASE tier
    WHEN 0 THEN RETURN 0;
    WHEN 1 THEN RETURN 25;
    WHEN 2 THEN RETURN 50;
    WHEN 3 THEN RETURN 75;
    WHEN 4 THEN RETURN 100;
    WHEN 5 THEN RETURN 125;
    ELSE RETURN 0;
  END CASE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_bank_energy_bonus(INTEGER) TO authenticated, service_role, anon;

-- Add comment
COMMENT ON FUNCTION calculate_bank_energy_bonus(INTEGER) IS 'Calculates energy bonus from bank vault tier (matches BALANCE_CONFIG.ts)';

-- ============================================================================
-- PART 2: Create the reset function (with dynamic energy calculation)
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_daily_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_max_energy INTEGER := 240; -- ENERGY_CONFIG.MAX_ENERGY from BALANCE_CONFIG.ts
  updated_count INTEGER;
BEGIN
  -- Reset energy to dynamically calculated max, clear world maps, and clear discovered locations
  -- max_energy = base_max_energy (240) + bank vault bonus
  UPDATE player_profiles
  SET
    energy = base_max_energy + calculate_bank_energy_bonus(COALESCE(bank_vault_tier, 0)),
    world_map_data = NULL,
    discovered_locations = '[]'::jsonb,
    updated_at = NOW()
  WHERE user_id != '00000000-0000-0000-0000-000000000000';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Log the number of profiles updated
  RAISE NOTICE 'Daily reset completed for % profiles', updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_daily_data() TO authenticated, service_role, anon;

-- Add comment
COMMENT ON FUNCTION reset_daily_data() IS 'Resets daily game data: restores energy to dynamically calculated max (base + bank bonus), clears world maps, and clears discovered locations for all players';

-- Test the function (optional - uncomment to test)
-- SELECT reset_daily_data();

-- ============================================================================
-- PART 3: Enable pg_cron extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- PART 4: Remove old cron job if exists
-- ============================================================================

DO $$
BEGIN
  PERFORM cron.unschedule('daily-reset-trigger');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, ignore error
    NULL;
END $$;

-- ============================================================================
-- PART 5: Schedule the daily reset cron job
-- ============================================================================

-- NOTE: No Authorization header needed - Edge Function uses SUPABASE_SERVICE_ROLE_KEY env variable
SELECT cron.schedule(
  'daily-reset-trigger',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT net.http_post(
    url:='https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/daily-reset',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the cron job was created successfully
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'daily-reset-trigger';

-- Expected output:
-- You should see one row with:
-- - jobname: daily-reset-trigger
-- - schedule: 0 0 * * *
-- - active: true

-- ============================================================================
-- TESTING (OPTIONAL)
-- ============================================================================

-- Test the reset function directly:
-- SELECT reset_daily_data();

-- Test the Edge Function via HTTP:
/*
SELECT net.http_post(
  url:='https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/daily-reset',
  headers:=jsonb_build_object(
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
*/

-- Check cron job execution history:
/*
SELECT
  jr.jobid,
  j.jobname,
  jr.status,
  jr.return_message,
  jr.start_time,
  jr.end_time
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'daily-reset-trigger'
ORDER BY jr.start_time DESC
LIMIT 10;
*/

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- The system works as follows:
-- 1. Cron job runs at 00:00 UTC every day
-- 2. Cron job calls the daily-reset Edge Function via HTTP
-- 3. Edge Function calls reset_daily_data() SQL function
-- 4. SQL function updates all player profiles:
--    - Restores energy to max_energy
--    - Sets world_map_data to NULL (forces regeneration)
--    - Clears discovered_locations array
--
-- To remove the cron job:
-- SELECT cron.unschedule('daily-reset-trigger');
--
-- ============================================================================
