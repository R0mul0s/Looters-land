-- 1. Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. Check all active CRON jobs
SELECT
  jobid,
  schedule,
  command,
  active,
  jobname
FROM cron.job;

-- 3. Check recent CRON job executions
SELECT
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- 4. Check if Realtime is enabled for player_profiles
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- 5. Manually test energy regeneration RIGHT NOW
SELECT regenerate_player_energy();

-- 6. Check current energy levels and last update time
SELECT
  user_id,
  nickname,
  energy,
  max_energy,
  updated_at,
  NOW() - updated_at as time_since_update
FROM player_profiles
ORDER BY updated_at DESC;

-- 7. Force update energy for testing (replace with your user_id)
-- UPDATE player_profiles
-- SET energy = LEAST(energy + 10, max_energy), updated_at = NOW()
-- WHERE user_id = 'YOUR_USER_ID_HERE';
