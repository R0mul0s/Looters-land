-- ============================================================================
-- CLEANUP: Remove duplicate energy regeneration cron jobs
-- ============================================================================
-- Created: 2025-11-18
-- Purpose: Remove all hourly-energy-regeneration cron jobs to fix duplicate execution
-- ============================================================================

-- STEP 1: List all current cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
ORDER BY jobname;

-- STEP 2: Find all energy-related cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname LIKE '%energy%'
   OR command LIKE '%regenerate_player_energy%';

-- STEP 3: Remove ALL hourly-energy-regeneration jobs (including duplicates)
DO $$
DECLARE
  job_record RECORD;
  jobs_removed INTEGER := 0;
BEGIN
  -- Loop through all jobs with this name and remove them
  FOR job_record IN
    SELECT jobid, jobname
    FROM cron.job
    WHERE jobname = 'hourly-energy-regeneration'
  LOOP
    PERFORM cron.unschedule(job_record.jobname);
    jobs_removed := jobs_removed + 1;
    RAISE NOTICE 'Removed cron job: % (ID: %)', job_record.jobname, job_record.jobid;
  END LOOP;

  RAISE NOTICE 'Total cron jobs removed: %', jobs_removed;
END $$;

-- STEP 4: Verify all energy cron jobs are removed
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'hourly-energy-regeneration';

-- Expected result: No rows (all removed)

-- ============================================================================
-- STEP 5: Re-create SINGLE hourly energy regeneration cron job
-- ============================================================================

-- Make sure the function exists first
SELECT proname FROM pg_proc WHERE proname = 'regenerate_player_energy';

-- Create new hourly cron job (only ONE)
SELECT cron.schedule(
  'hourly-energy-regeneration',        -- Job name
  '0 * * * *',                          -- Cron expression: every hour at :00
  $$SELECT regenerate_player_energy();$$ -- SQL to execute
);

-- STEP 6: Verify exactly ONE cron job exists
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'hourly-energy-regeneration';

-- Expected result: Exactly 1 row with schedule '0 * * * *'

-- ============================================================================
-- STEP 7: Test the cron job manually
-- ============================================================================

-- Check current energy levels BEFORE regeneration
SELECT
  user_id,
  nickname,
  energy,
  max_energy,
  updated_at
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC
LIMIT 5;

-- Manually trigger regeneration
SELECT regenerate_player_energy();

-- Check energy levels AFTER regeneration (should be +10 if below max)
SELECT
  user_id,
  nickname,
  energy,
  max_energy,
  updated_at
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- MONITORING: Check future cron executions
-- ============================================================================

-- Wait 1 hour and run this query to check if cron executed
SELECT
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-energy-regeneration')
ORDER BY start_time DESC
LIMIT 10;

-- Expected: Should see exactly 1 execution per hour (not 2!)
