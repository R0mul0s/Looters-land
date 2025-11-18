-- ============================================================================
-- EMERGENCY FIX: Remove duplicate energy regeneration cron jobs
-- ============================================================================
-- Created: 2025-11-18
-- Issue: Multiple cron jobs are running, causing energy to regenerate too fast
-- Solution: Remove ALL energy cron jobs and create exactly ONE
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current situation (DIAGNOSTIC)
-- ============================================================================

-- List ALL cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command,
  nodename,
  nodeport
FROM cron.job
ORDER BY jobname;

-- Count how many energy regen jobs exist (should be 1, but might be more!)
SELECT COUNT(*) as total_energy_jobs
FROM cron.job
WHERE jobname = 'hourly-energy-regeneration'
   OR command LIKE '%regenerate_player_energy%';

-- ============================================================================
-- STEP 2: REMOVE ALL energy regeneration cron jobs
-- ============================================================================

-- This will remove ALL instances of the cron job
DO $$
DECLARE
  job_record RECORD;
  jobs_removed INTEGER := 0;
BEGIN
  -- Remove all jobs by name (handles duplicates with same name)
  FOR job_record IN
    SELECT jobid, jobname
    FROM cron.job
    WHERE jobname = 'hourly-energy-regeneration'
  LOOP
    -- Use jobid instead of jobname for unscheduling
    PERFORM cron.unschedule(job_record.jobid::bigint);
    jobs_removed := jobs_removed + 1;
    RAISE NOTICE 'Removed cron job: % (ID: %)', job_record.jobname, job_record.jobid;
  END LOOP;

  -- Also remove any orphaned jobs that call the function directly
  FOR job_record IN
    SELECT jobid, jobname
    FROM cron.job
    WHERE command LIKE '%regenerate_player_energy%'
      AND jobname != 'hourly-energy-regeneration'
  LOOP
    PERFORM cron.unschedule(job_record.jobid::bigint);
    jobs_removed := jobs_removed + 1;
    RAISE NOTICE 'Removed orphaned energy job: % (ID: %)', job_record.jobname, job_record.jobid;
  END LOOP;

  RAISE NOTICE '✅ Total energy cron jobs removed: %', jobs_removed;
END $$;

-- ============================================================================
-- STEP 3: Verify ALL energy jobs are gone
-- ============================================================================

SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'hourly-energy-regeneration'
   OR command LIKE '%regenerate_player_energy%';

-- Expected result: NO ROWS (all removed)

-- ============================================================================
-- STEP 4: Create EXACTLY ONE new cron job
-- ============================================================================

-- Verify the function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'regenerate_player_energy';

-- Create the SINGLE cron job
SELECT cron.schedule(
  'hourly-energy-regeneration',        -- Job name (unique)
  '0 * * * *',                          -- Every hour at :00 minutes
  $$SELECT regenerate_player_energy();$$ -- Call the function
);

-- ============================================================================
-- STEP 5: Final verification
-- ============================================================================

-- Should show EXACTLY 1 row
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'hourly-energy-regeneration';

-- Check recent executions (if any)
SELECT
  jr.jobid,
  j.jobname,
  jr.runid,
  jr.status,
  jr.start_time,
  jr.end_time,
  jr.return_message
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'hourly-energy-regeneration'
ORDER BY jr.start_time DESC
LIMIT 10;

-- ============================================================================
-- STEP 6: Manual test (OPTIONAL - only for testing)
-- ============================================================================

-- Check your current energy
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

-- Manually trigger regeneration ONCE (for testing)
-- SELECT regenerate_player_energy();

-- Check energy again (should be +10 if below max)
-- SELECT
--   user_id,
--   nickname,
--   energy,
--   max_energy,
--   updated_at
-- FROM player_profiles
-- WHERE user_id != '00000000-0000-0000-0000-000000000000'
-- ORDER BY updated_at DESC
-- LIMIT 5;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- After running this script:
-- ✅ All duplicate cron jobs removed
-- ✅ Exactly ONE cron job created
-- ✅ Energy will regenerate +10 per hour (not more!)
-- ============================================================================
