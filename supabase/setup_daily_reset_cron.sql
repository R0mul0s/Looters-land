-- ============================================================================
-- SETUP DAILY RESET CRON JOB
-- ============================================================================
-- This script sets up automatic daily reset at midnight UTC
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard
-- 2. Go to your project: Looters Land
-- 3. Go to SQL Editor
-- 4. Paste this entire script
-- 5. Click "Run"
--
-- @author Roman Hlaváček - rhsoft.cz
-- @copyright 2025
-- @created 2025-11-10
-- ============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing daily reset job if it exists (to avoid duplicates)
DO $$
BEGIN
  PERFORM cron.unschedule('daily-reset-trigger');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, ignore error
    NULL;
END $$;

-- Schedule the daily reset Edge Function to run at 00:00 UTC every day
SELECT cron.schedule(
  'daily-reset-trigger',
  '0 0 * * *', -- Every day at midnight UTC (cron format: minute hour day month weekday)
  $$
  SELECT net.http_post(
    url:='https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/daily-reset',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra2pkc2NpaXp0b2VxeWN4bXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTE1NTcsImV4cCI6MjA3ODA2NzU1N30.mCaZBekUEO_Irpucx5tOm2Mk_FM7KbiJo-BJB5wOBy0"}'::jsonb
  )
  $$
);

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
-- TESTING THE CRON JOB
-- ============================================================================

-- To manually test the daily reset function without waiting for midnight:
/*
SELECT net.http_post(
  url:='https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/daily-reset',
  headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra2pkc2NpaXp0b2VxeWN4bXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0OTE1NTcsImV4cCI6MjA3ODA2NzU1N30.mCaZBekUEO_Irpucx5tOm2Mk_FM7KbiJo-BJB5wOBy0"}'::jsonb
);
*/

-- To check execution history:
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
-- 1. The cron job runs at 00:00 UTC (midnight UTC) every day
-- 2. The Edge Function will:
--    - Restore all players' energy to max
--    - Reset world maps (set to null for regeneration)
--    - Reset discovered locations
-- 3. You can check execution logs in Supabase Dashboard -> Edge Functions
-- 4. To remove the cron job: SELECT cron.unschedule('daily-reset-trigger');
--
-- ============================================================================
