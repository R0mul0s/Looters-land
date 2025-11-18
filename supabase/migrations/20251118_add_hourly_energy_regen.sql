-- Migration: Add hourly energy regeneration cron job
-- Created: 2025-11-18
-- Description: Creates function and cron job for automatic energy regeneration every hour

-- ============================================================================
-- STEP 1: Create function for hourly energy regeneration
-- ============================================================================

CREATE OR REPLACE FUNCTION regenerate_player_energy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  players_updated INTEGER := 0;
BEGIN
  -- Regenerate 10 energy per hour for all active players
  -- Only update if current energy < max energy
  UPDATE player_profiles
  SET
    energy = LEAST(energy + 10, max_energy),
    updated_at = NOW()
  WHERE
    energy < max_energy
    AND user_id != '00000000-0000-0000-0000-000000000000'; -- Skip demo user

  -- Get count of updated players
  GET DIAGNOSTICS players_updated = ROW_COUNT;

  -- Log the regeneration event
  RAISE NOTICE 'Hourly energy regeneration completed for % players', players_updated;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION regenerate_player_energy() TO authenticated, service_role, anon;

-- Add comment
COMMENT ON FUNCTION regenerate_player_energy() IS 'Regenerates 10 energy per hour for all players who are below max energy. Called by hourly cron job.';

-- ============================================================================
-- STEP 2: Setup hourly cron job (runs at :00 of every hour)
-- ============================================================================

-- Check if pg_cron extension is enabled (should be enabled by Supabase)
-- If not enabled, this will fail - contact Supabase support to enable it

-- Remove existing hourly energy regen job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('hourly-energy-regeneration');
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore error if job doesn't exist
END $$;

-- Create new hourly cron job
-- Runs every hour at :00 minutes (e.g., 13:00, 14:00, 15:00)
SELECT cron.schedule(
  'hourly-energy-regeneration',        -- Job name
  '0 * * * *',                          -- Cron expression: every hour at :00
  $$SELECT regenerate_player_energy();$$ -- SQL to execute
);

-- ============================================================================
-- VERIFICATION QUERIES (run these manually to verify setup)
-- ============================================================================

-- Check if cron job was created successfully
-- SELECT * FROM cron.job WHERE jobname = 'hourly-energy-regeneration';

-- Check recent cron job executions
-- SELECT *
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-energy-regeneration')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Manually trigger energy regeneration for testing
-- SELECT regenerate_player_energy();

-- Check current energy levels
-- SELECT
--   user_id,
--   nickname,
--   energy,
--   max_energy,
--   updated_at
-- FROM player_profiles
-- WHERE user_id != '00000000-0000-0000-0000-000000000000'
-- ORDER BY updated_at DESC;
