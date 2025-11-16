-- ============================================================================
-- CHECK WEATHER AND TIME STATUS
-- ============================================================================

-- 1. Check current global world state
SELECT
  weather_current,
  weather_next,
  weather_transition_start,
  weather_duration,
  time_current,
  time_next,
  time_transition_start,
  time_duration,
  updated_at,
  NOW() as current_time,
  -- Calculate when next transition should occur
  weather_transition_start + (weather_duration || ' minutes')::interval as next_weather_change,
  time_transition_start + (time_duration || ' minutes')::interval as next_time_change
FROM global_world_state
WHERE id = 1;

-- 2. Check if cron job exists
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'update-global-world-state';

-- 3. Check recent cron job runs
SELECT
  jr.jobid,
  j.jobname,
  jr.status,
  jr.return_message,
  jr.start_time,
  jr.end_time
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'update-global-world-state'
ORDER BY jr.start_time DESC
LIMIT 10;

-- 4. Manually trigger weather update (for testing)
-- Uncomment to test:
-- SELECT net.http_post(
--   url := 'https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/update-global-world-state',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json'
--   ),
--   body := '{}'::jsonb
-- ) AS request_id;
