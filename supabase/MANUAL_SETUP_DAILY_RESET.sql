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
-- PART 1: Create the reset function
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_daily_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset energy to max, clear world maps, and clear discovered locations
  UPDATE player_profiles
  SET
    energy = max_energy,
    world_map_data = NULL,
    discovered_locations = '[]'::jsonb,
    updated_at = NOW()
  WHERE user_id != '00000000-0000-0000-0000-000000000000';

  -- Log the number of profiles updated
  RAISE NOTICE 'Daily reset completed for % profiles', (SELECT COUNT(*) FROM player_profiles WHERE user_id != '00000000-0000-0000-0000-000000000000');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_daily_data() TO authenticated, service_role, anon;

-- Add comment
COMMENT ON FUNCTION reset_daily_data() IS 'Resets daily game data: restores energy to max, clears world maps, and clears discovered locations for all players';

-- Test the function (optional - uncomment to test)
-- SELECT reset_daily_data();

-- ============================================================================
-- PART 2: Enable pg_cron extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- PART 3: Remove old cron job if exists
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
-- PART 4: Schedule the daily reset cron job
-- ============================================================================

SELECT cron.schedule(
  'daily-reset-trigger',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT net.http_post(
    url:='https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/daily-reset',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra2pkc2NpaXp0b2VxeWN4bXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTE1NTcsImV4cCI6MjA3ODA2NzU1N30.mCaZBekUEO_Irpucx5tOm2Mk_FM7KbiJo-BJB5wOBy0"}'::jsonb
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
  headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra2pkc2NpaXp0b2VxeWN4bXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTE1NTcsImV4cCI6MjA3ODA2NzU1N30.mCaZBekUEO_Irpucx5tOm2Mk_FM7KbiJo-BJB5wOBy0"}'::jsonb
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
