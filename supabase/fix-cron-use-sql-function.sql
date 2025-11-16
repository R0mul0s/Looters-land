-- ============================================================================
-- FIX CRON JOB - Use SQL function instead of Edge Function
-- ============================================================================
-- This approach avoids authentication issues completely by using SQL function
--
-- @created 2025-11-16
-- ============================================================================

-- Step 1: Run the migration first
-- Make sure you run: 20251116_add_sql_update_world_state.sql

-- Step 2: Delete the old cron job
SELECT cron.unschedule('update-global-world-state');

-- Step 3: Create new cron job that calls SQL function directly
SELECT cron.schedule(
  'update-global-world-state',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT update_global_world_state();
  $$
);

-- Step 4: Verify the cron job was created
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'update-global-world-state';

-- Step 5: Test the function manually
SELECT update_global_world_state();

-- Step 6: Check the result
SELECT
  weather_current,
  weather_next,
  time_current,
  time_next,
  weather_transition_start,
  time_transition_start,
  weather_duration,
  time_duration,
  updated_at,
  NOW() as current_time,
  weather_transition_start + (weather_duration || ' minutes')::interval as next_weather_change,
  time_transition_start + (time_duration || ' minutes')::interval as next_time_change
FROM global_world_state
WHERE id = 1;
