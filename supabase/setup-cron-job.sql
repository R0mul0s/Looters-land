-- Setup Cron Job for Global World State Updates
-- Run this in Supabase SQL Editor
-- Created: 2025-11-13

-- Step 1: Check if cron job already exists
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'update-global-world-state';

-- If the above returns any rows, FIRST DELETE the old cron job:
-- SELECT cron.unschedule('update-global-world-state');

-- Step 2: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 3: Enable pg_net extension (required for HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 4: Create the cron job
-- This will run every 15 minutes and call your Edge Function
SELECT cron.schedule(
  'update-global-world-state',           -- Job name
  '*/15 * * * *',                        -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/update-global-world-state',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra2pkc2NpaXp0b2VxeWN4bXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ5MTU1NywiZXhwIjoyMDc4MDY3NTU3fQ.gbJnnw3oKgLRS4uthChBtK_RsTWvWG-Qlidu66nyJn0'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Step 5: Verify the cron job was created
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'update-global-world-state';

-- You should see one row with:
-- - jobname: update-global-world-state
-- - schedule: */15 * * * *
-- - active: true

-- Step 6: Check recent runs (after waiting 15 minutes)
SELECT
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-global-world-state')
ORDER BY start_time DESC
LIMIT 5;

-- Step 7: Monitor Edge Function logs in database
-- (This will only work after running the migration: 20251113_add_edge_function_logs.sql)
SELECT
  function_name,
  success,
  execution_time_ms,
  metadata,
  invoked_at
FROM edge_function_logs
WHERE function_name = 'update-global-world-state'
ORDER BY invoked_at DESC
LIMIT 10;

-- NOTES:
-- 1. The cron job runs every 15 minutes (at :00, :15, :30, :45)
-- 2. To change frequency, modify the schedule:
--    - '*/5 * * * *'   = Every 5 minutes
--    - '*/30 * * * *'  = Every 30 minutes
--    - '0 * * * *'     = Every hour
-- 3. To disable the job: UPDATE cron.job SET active = false WHERE jobname = 'update-global-world-state';
-- 4. To delete the job: SELECT cron.unschedule('update-global-world-state');
