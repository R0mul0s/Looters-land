-- Diagnostic queries for weather/time auto-update issue
-- Run these queries in Supabase SQL Editor to diagnose the problem
-- Created: 2025-11-13

-- ==========================================
-- 1. CHECK CRON JOB COMMAND (MOST IMPORTANT!)
-- ==========================================
-- This shows the exact command being run by the cron job
-- Verify the URL and Authorization header are correct

SELECT
  jobid,
  jobname,
  schedule,
  command
FROM cron.job
WHERE jobname = 'update-global-world-state';

-- Expected output should show:
-- - Correct Supabase project URL
-- - SERVICE_ROLE_KEY in Authorization header
-- - Function name spelled correctly

-- ==========================================
-- 2. CHECK RECENT CRON JOB RUNS
-- ==========================================
-- Shows detailed results from recent cron job executions

SELECT
  jobid,
  runid,
  job_pid,
  status,
  return_message,  -- Important: shows response from Edge Function
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-global-world-state')
ORDER BY start_time DESC
LIMIT 10;

-- Look for:
-- - status = 'succeeded' (good)
-- - return_message should contain response from Edge Function
-- - If return_message is null or empty, Edge Function is not responding

-- ==========================================
-- 3. CHECK CURRENT WEATHER/TIME STATE
-- ==========================================
-- Shows when weather and time should change

SELECT
  weather_current,
  weather_next,
  weather_transition_start,
  weather_duration,
  weather_transition_start + (weather_duration || ' minutes')::interval AS weather_changes_at,
  time_current,
  time_next,
  time_transition_start,
  time_duration,
  time_transition_start + (time_duration || ' minutes')::interval AS time_changes_at,
  updated_at,
  NOW() AS current_time,
  -- Calculate if transitions should have happened
  CASE
    WHEN NOW() >= weather_transition_start + (weather_duration || ' minutes')::interval
    THEN '🔴 Weather should have changed!'
    ELSE '🟢 Weather change not due yet'
  END AS weather_status,
  CASE
    WHEN NOW() >= time_transition_start + (time_duration || ' minutes')::interval
    THEN '🔴 Time should have changed!'
    ELSE '🟢 Time change not due yet'
  END AS time_status
FROM global_world_state
WHERE id = 1;

-- ==========================================
-- 4. TEST PG_NET EXTENSION
-- ==========================================
-- Verify pg_net is working properly

SELECT
  net.http_post(
    url := 'https://httpbin.org/post',
    body := '{"test": "pg_net working"}'::jsonb
  ) AS request_id;

-- If this returns an error, pg_net is not working
-- If it returns a request_id (UUID), pg_net is working

-- ==========================================
-- 5. CHECK REALTIME PUBLICATION
-- ==========================================
-- Verify global_world_state is in Realtime publication

SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'global_world_state';

-- Should return one row showing global_world_state is published

-- ==========================================
-- 6. CHECK RLS POLICIES
-- ==========================================
-- Verify service_role can update the table

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'global_world_state';

-- Should show:
-- - Policy for service_role with UPDATE permission
-- - qual and with_check = true (allows all updates)

-- ==========================================
-- QUICK FIX: FORCE IMMEDIATE TRANSITION TEST
-- ==========================================
-- Uncomment and run these lines to force a transition in 1 minute for testing

-- UPDATE global_world_state
-- SET
--   time_transition_start = NOW(),
--   time_duration = 1  -- Will expire in 1 minute
-- WHERE id = 1;

-- Wait 2 minutes after running above, then check if time changed:

-- SELECT
--   time_current,
--   time_next,
--   updated_at,
--   NOW() AS current_time
-- FROM global_world_state
-- WHERE id = 1;

-- ==========================================
-- NOTES FOR USER
-- ==========================================
/*

WHAT TO DO WITH RESULTS:

1. Query #1 (Cron command):
   - Copy the URL and verify it matches your Supabase project
   - Check Authorization header has your SERVICE_ROLE_KEY (starts with "eyJ...")
   - If URL or key is wrong, see DEBUG_WEATHER_TIME_UPDATES.md for fix

2. Query #2 (Recent runs):
   - If return_message is null/empty: Edge Function not responding
   - If return_message shows error: Read the error message
   - If return_message is missing: cron job not calling Edge Function

3. Query #3 (Current state):
   - Red status (🔴) means transition is overdue
   - If overdue but updated_at is old: Edge Function not updating DB

4. Query #4 (pg_net test):
   - If error: pg_net not working, need to enable it
   - If returns UUID: pg_net is working fine

5. Query #5 (Realtime):
   - If no rows: Run `ALTER PUBLICATION supabase_realtime ADD TABLE global_world_state;`

6. Query #6 (RLS policies):
   - If no service_role policy: Run the CREATE POLICY commands from migration

MOST COMMON ISSUES:
- Wrong Edge Function URL in cron job (check Query #1)
- Wrong Authorization key (check Query #1)
- Edge Function not deployed (check Supabase Dashboard → Edge Functions)
- pg_net not returning results (check Query #2 for return_message)

For detailed fixes, see: docs/DEBUG_WEATHER_TIME_UPDATES.md

*/
