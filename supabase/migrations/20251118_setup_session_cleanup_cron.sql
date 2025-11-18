/**
 * Setup Cron Job for Automatic Session Cleanup
 *
 * Creates a pg_cron job that runs cleanup_stale_sessions() every minute
 * to automatically mark inactive players as offline.
 *
 * This ensures that players who close their browser/tab without logging out
 * will be marked as offline within 5 minutes of their last heartbeat.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @created 2025-11-18
 */

-- ============================================================================
-- 1. Enable pg_cron extension (if not already enabled)
-- ============================================================================

-- Note: pg_cron is usually pre-enabled on Supabase, but we ensure it here
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- 2. Create cron job to run cleanup every minute
-- ============================================================================

-- First, unschedule any existing job with the same name (idempotent)
-- Use DO block to safely handle case when job doesn't exist
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-stale-sessions');
EXCEPTION
  WHEN undefined_object THEN
    -- Job doesn't exist yet, that's fine
    NULL;
  WHEN OTHERS THEN
    -- Job doesn't exist, that's fine
    NULL;
END $$;

-- Schedule the cleanup job to run every minute
-- Returns job_id which we can use to monitor/manage the job
SELECT cron.schedule(
  'cleanup-stale-sessions',           -- Job name
  '* * * * *',                        -- Cron expression: every minute
  $$SELECT cleanup_stale_sessions()$$ -- SQL command to execute
);

-- ============================================================================
-- 3. Grant permissions
-- ============================================================================

-- Ensure the cron job can execute the cleanup function
GRANT EXECUTE ON FUNCTION cleanup_stale_sessions TO postgres;

-- ============================================================================
-- Success message with instructions
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Session cleanup cron job installed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Cron Job Details:';
  RAISE NOTICE '  Name: cleanup-stale-sessions';
  RAISE NOTICE '  Schedule: Every minute (* * * * *)';
  RAISE NOTICE '  Action: Marks sessions inactive after 5 minutes of no heartbeat';
  RAISE NOTICE '  Effect: Players shown as offline if no activity for 5+ minutes';
  RAISE NOTICE '';
  RAISE NOTICE 'To monitor the cron job:';
  RAISE NOTICE '  SELECT * FROM cron.job WHERE jobname = ''cleanup-stale-sessions'';';
  RAISE NOTICE '';
  RAISE NOTICE 'To view cron job history:';
  RAISE NOTICE '  SELECT * FROM cron.job_run_details WHERE jobid = (';
  RAISE NOTICE '    SELECT jobid FROM cron.job WHERE jobname = ''cleanup-stale-sessions''';
  RAISE NOTICE '  ) ORDER BY start_time DESC LIMIT 10;';
  RAISE NOTICE '';
  RAISE NOTICE 'To manually unschedule:';
  RAISE NOTICE '  SELECT cron.unschedule(''cleanup-stale-sessions'');';
END $$;
