-- Check all active cron jobs
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid;

-- Check recent cron job execution history
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- Manually test energy regeneration function
SELECT regenerate_player_energy();

-- Check current player energy levels
SELECT
  user_id,
  nickname,
  energy,
  max_energy,
  updated_at
FROM player_profiles
ORDER BY updated_at DESC
LIMIT 10;
