-- ============================================================================
-- TEST: Manually trigger energy regeneration
-- ============================================================================
-- Use this to test the energy regeneration without waiting for cron job
-- ============================================================================

-- STEP 1: Check your current energy BEFORE regeneration
SELECT
  user_id,
  nickname,
  energy,
  max_energy,
  (max_energy - energy) as missing_energy,
  updated_at
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 2: Manually trigger energy regeneration (+10 energy)
-- ============================================================================

SELECT regenerate_player_energy();

-- ============================================================================
-- STEP 3: Check your energy AFTER regeneration (should be +10 if below max)
-- ============================================================================

SELECT
  user_id,
  nickname,
  energy,
  max_energy,
  (max_energy - energy) as missing_energy,
  updated_at
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- EXPECTED RESULT:
-- - If energy was below max: energy increased by +10 (capped at max_energy)
-- - If energy was at max: no change
-- - updated_at timestamp should be updated
-- ============================================================================

-- ============================================================================
-- BONUS: Check cron job status
-- ============================================================================

-- Verify cron job exists and is active
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'hourly-energy-regeneration';

-- Check recent cron executions
SELECT
  jr.runid,
  jr.status,
  jr.return_message,
  jr.start_time,
  jr.end_time,
  EXTRACT(EPOCH FROM (jr.end_time - jr.start_time)) as duration_seconds
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'hourly-energy-regeneration'
ORDER BY jr.start_time DESC
LIMIT 5;
