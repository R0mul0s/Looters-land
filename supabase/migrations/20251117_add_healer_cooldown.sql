-- Healer Cooldown System Migration
-- Version: 1.0
-- Date: 2025-11-17
-- Description: Adds cooldown tracking for healer party heal (60 minute cooldown)

-- ============================================================================
-- 1. Add healer_cooldown_until column to player_profiles
-- ============================================================================

ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS healer_cooldown_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN player_profiles.healer_cooldown_until IS 'Timestamp when healer party heal becomes available again (60 min cooldown)';

-- ============================================================================
-- 2. Create index for cooldown queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_healer_cooldown ON player_profiles(healer_cooldown_until)
WHERE healer_cooldown_until IS NOT NULL;

COMMENT ON INDEX idx_healer_cooldown IS 'Index for fast cooldown expiration checks';

-- ============================================================================
-- 3. Create helper function to check if healer is on cooldown
-- ============================================================================

CREATE OR REPLACE FUNCTION is_healer_on_cooldown(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    cooldown_time TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT healer_cooldown_until INTO cooldown_time
    FROM player_profiles
    WHERE user_id = user_id_param;

    -- If no cooldown set, healer is available
    IF cooldown_time IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if current time is before cooldown expiration
    RETURN NOW() < cooldown_time;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_healer_on_cooldown IS 'Returns true if healer party heal is on cooldown for given user';

-- ============================================================================
-- 4. Create helper function to get remaining cooldown time
-- ============================================================================

CREATE OR REPLACE FUNCTION get_healer_cooldown_remaining(user_id_param UUID)
RETURNS INTERVAL AS $$
DECLARE
    cooldown_time TIMESTAMP WITH TIME ZONE;
    remaining INTERVAL;
BEGIN
    SELECT healer_cooldown_until INTO cooldown_time
    FROM player_profiles
    WHERE user_id = user_id_param;

    -- If no cooldown set, return 0
    IF cooldown_time IS NULL THEN
        RETURN INTERVAL '0 seconds';
    END IF;

    -- Calculate remaining time
    remaining := cooldown_time - NOW();

    -- If cooldown expired, return 0
    IF remaining < INTERVAL '0 seconds' THEN
        RETURN INTERVAL '0 seconds';
    END IF;

    RETURN remaining;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_healer_cooldown_remaining IS 'Returns remaining cooldown time for healer party heal (0 if available)';

-- ============================================================================
-- 5. Create function to set healer cooldown (60 minutes)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_healer_cooldown(user_id_param UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    new_cooldown TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set cooldown to 60 minutes from now
    new_cooldown := NOW() + INTERVAL '60 minutes';

    UPDATE player_profiles
    SET healer_cooldown_until = new_cooldown
    WHERE user_id = user_id_param;

    RETURN new_cooldown;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_healer_cooldown IS 'Sets healer party heal cooldown to 60 minutes from now';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries (run these to verify migration success)
-- Check column exists:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'player_profiles' AND column_name = 'healer_cooldown_until';

-- Test helper functions:
-- SELECT is_healer_on_cooldown('your-user-id-here'); -- Should return FALSE initially
-- SELECT set_healer_cooldown('your-user-id-here'); -- Should return timestamp 60 min in future
-- SELECT is_healer_on_cooldown('your-user-id-here'); -- Should return TRUE after setting
-- SELECT get_healer_cooldown_remaining('your-user-id-here'); -- Should return ~60 minutes
