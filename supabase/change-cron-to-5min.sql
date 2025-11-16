-- Change cron schedule from 15 minutes to 5 minutes

-- Step 1: Delete the old cron job
SELECT cron.unschedule('update-global-world-state');

-- Step 2: Create new cron job with 5 minute interval
SELECT cron.schedule(
  'update-global-world-state',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT update_global_world_state();
  $$
);

-- Step 3: Verify the cron job was recreated
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'update-global-world-state';

-- Expected: schedule should be */5 * * * *

-- Step 4: Manually trigger to test
SELECT update_global_world_state();

-- Step 5: Check the result
SELECT
  weather_current,
  weather_next,
  time_current,
  time_next,
  weather_transition_start AT TIME ZONE 'Europe/Prague' as weather_start_cet,
  time_transition_start AT TIME ZONE 'Europe/Prague' as time_start_cet,
  weather_duration,
  time_duration,
  updated_at AT TIME ZONE 'Europe/Prague' as updated_cet,
  NOW() AT TIME ZONE 'Europe/Prague' as now_cet,
  (weather_transition_start + (weather_duration || ' minutes')::interval) AT TIME ZONE 'Europe/Prague' as next_weather_change_cet,
  (time_transition_start + (time_duration || ' minutes')::interval) AT TIME ZONE 'Europe/Prague' as next_time_change_cet
FROM global_world_state
WHERE id = 1;
