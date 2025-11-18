/**
 * Add Online Status Integration with Session Management
 *
 * Updates session heartbeat and cleanup functions to manage is_online status
 * in player_profiles table (which already has is_online column).
 *
 * This is automatically managed by the session heartbeat system.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @created 2025-11-18
 */

-- ============================================================================
-- 1. Verify is_online column exists in player_profiles (should already exist)
-- ============================================================================

-- Note: is_online already exists in player_profiles from 20251109000002_add_multiplayer_features.sql
-- This migration only updates the functions to manage it via session heartbeat

-- ============================================================================
-- 2. Update update_session_heartbeat to set is_online=true
-- ============================================================================

DROP FUNCTION IF EXISTS update_session_heartbeat(TEXT);

CREATE OR REPLACE FUNCTION update_session_heartbeat(
  p_session_id TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  is_still_active BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_active BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false AS success, false AS is_still_active, 'Not authenticated' AS message;
    RETURN;
  END IF;

  -- Update heartbeat and check if session is still active
  UPDATE user_sessions us
  SET last_heartbeat = NOW()
  WHERE us.session_id = p_session_id
    AND us.user_id = v_user_id
    AND us.is_active = true
  RETURNING us.is_active INTO v_is_active;

  -- Check if update was successful
  IF NOT FOUND THEN
    -- Session was invalidated or doesn't exist
    RETURN QUERY SELECT true AS success, false AS is_still_active, 'Session is no longer active' AS message;
  ELSE
    -- Update player online status in player_profiles
    UPDATE player_profiles
    SET is_online = true, last_seen = NOW()
    WHERE user_id::text = v_user_id::text;

    RETURN QUERY SELECT true AS success, v_is_active AS is_still_active, 'Heartbeat updated' AS message;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_session_heartbeat TO authenticated;

-- ============================================================================
-- 3. Update cleanup_stale_sessions to set is_online=false
-- ============================================================================

DROP FUNCTION IF EXISTS cleanup_stale_sessions();

CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS TABLE (
  cleaned_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleaned_count INTEGER := 0;
  v_stale_threshold INTERVAL := INTERVAL '5 minutes';
BEGIN
  -- Mark sessions as inactive if no heartbeat for 5 minutes
  -- and mark corresponding players as offline in player_profiles
  WITH stale_users AS (
    UPDATE user_sessions us
    SET is_active = false
    WHERE us.is_active = true
      AND us.last_heartbeat < NOW() - v_stale_threshold
    RETURNING us.user_id
  )
  -- Mark corresponding players as offline in player_profiles
  UPDATE player_profiles pp
  SET is_online = false
  FROM stale_users su
  WHERE pp.user_id::text = su.user_id::text;

  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;

  -- Optionally delete very old inactive sessions (older than 7 days)
  DELETE FROM user_sessions us
  WHERE us.is_active = false
    AND us.created_at < NOW() - INTERVAL '7 days';

  RETURN QUERY SELECT v_cleaned_count AS cleaned_count, 'Cleanup completed' AS message;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_stale_sessions TO authenticated, service_role;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Online status tracking via session management installed successfully!';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Updated update_session_heartbeat to set player_profiles.is_online=true';
  RAISE NOTICE '  - Updated cleanup_stale_sessions to set player_profiles.is_online=false';
  RAISE NOTICE 'Note: is_online column already exists in player_profiles table';
END $$;
