-- Quick diagnostic: Why is Edge Function not running?
-- Run this in Supabase SQL Editor

-- 1. Check if cron job exists
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'update-global-world-state';

-- If no rows returned, cron job is not created!
-- Fix: Run the setup SQL from docs/GLOBAL_WORLD_STATE_SETUP.md

-- 2. Check recent cron runs (last 5)
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

-- What to look for:
-- - status should be 'succeeded'
-- - return_message should have JSON response from Edge Function
-- - If return_message is null/empty, Edge Function is not responding

-- 3. Check current database state
SELECT
  weather_current,
  weather_next,
  weather_transition_start,
  weather_duration,
  weather_transition_start + (weather_duration || ' minutes')::interval AS weather_expires_at,
  time_current,
  time_next,
  time_transition_start,
  time_duration,
  time_transition_start + (time_duration || ' minutes')::interval AS time_expires_at,
  updated_at,
  NOW() AS current_time,
  -- Check if expired
  CASE
    WHEN NOW() >= weather_transition_start + (weather_duration || ' minutes')::interval
    THEN '🔴 EXPIRED'
    ELSE '🟢 OK'
  END AS weather_status,
  CASE
    WHEN NOW() >= time_transition_start + (time_duration || ' minutes')::interval
    THEN '🔴 EXPIRED'
    ELSE '🟢 OK'
  END AS time_status
FROM global_world_state
WHERE id = 1;

-- If both are EXPIRED but updated_at is old, Edge Function is not updating!

-- 4. Manual trigger test (run Edge Function manually)
-- Copy this curl command and run it in terminal:

/*
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/update-global-world-state' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
*/

-- Replace:
-- - YOUR_PROJECT with your project ref
-- - YOUR_SERVICE_ROLE_KEY with service role key from Dashboard → Settings → API

-- 5. Check if Edge Function is deployed
-- Run this in terminal:
-- supabase functions list

-- Should show: update-global-world-state

-- 6. If cron job doesn't exist, create it:
/*
SELECT cron.schedule(
  'update-global-world-state',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/update-global-world-state',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/
