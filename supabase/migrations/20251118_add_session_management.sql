/**
 * Session Management System
 *
 * Implements single-session authentication:
 * - Tracks active user sessions across devices/tabs
 * - Automatically invalidates old sessions when user logs in from new device
 * - Supports real-time session monitoring
 * - Includes heartbeat mechanism for cleaning up stale sessions
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @created 2025-11-18
 */

-- ============================================================================
-- 1. Create user_sessions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,

  -- Indexes for performance
  CONSTRAINT user_sessions_session_id_key UNIQUE (session_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_heartbeat ON user_sessions(last_heartbeat) WHERE is_active = true;

-- ============================================================================
-- 2. Enable Row Level Security
-- ============================================================================

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions (via function)
CREATE POLICY "Users can create own sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Function: Create new session and invalidate old ones
-- ============================================================================

-- Drop existing function if signature changed
DROP FUNCTION IF EXISTS create_new_session(UUID, TEXT, JSONB);

CREATE OR REPLACE FUNCTION create_new_session(
  p_user_id UUID,
  p_session_id TEXT,
  p_device_info JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  returned_session_id TEXT,
  invalidated_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invalidated_count INTEGER := 0;
BEGIN
  -- Validate input
  IF p_user_id IS NULL OR p_session_id IS NULL THEN
    RETURN QUERY SELECT false AS success, 'Invalid input parameters' AS message, NULL::TEXT AS returned_session_id, 0 AS invalidated_count;
    RETURN;
  END IF;

  -- Check if user exists (additional safety check)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN QUERY SELECT false AS success, 'User not found' AS message, NULL::TEXT AS returned_session_id, 0 AS invalidated_count;
    RETURN;
  END IF;

  -- Deactivate all existing active sessions for this user
  UPDATE user_sessions us
  SET is_active = false
  WHERE us.user_id = p_user_id
    AND us.is_active = true
    AND us.session_id != p_session_id;

  GET DIAGNOSTICS v_invalidated_count = ROW_COUNT;

  -- Insert new session
  INSERT INTO user_sessions (user_id, session_id, device_info, is_active)
  VALUES (p_user_id, p_session_id, p_device_info, true)
  ON CONFLICT (session_id)
  DO UPDATE SET
    is_active = true,
    last_heartbeat = NOW(),
    device_info = EXCLUDED.device_info;

  -- Return success
  RETURN QUERY SELECT
    true AS success,
    'Session created successfully' AS message,
    p_session_id AS returned_session_id,
    v_invalidated_count AS invalidated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_new_session TO authenticated;

-- ============================================================================
-- 4. Function: Update session heartbeat
-- ============================================================================

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
    RETURN QUERY SELECT true AS success, v_is_active AS is_still_active, 'Heartbeat updated' AS message;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_session_heartbeat TO authenticated;

-- ============================================================================
-- 5. Function: Cleanup stale sessions (older than 5 minutes without heartbeat)
-- ============================================================================

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
  UPDATE user_sessions us
  SET is_active = false
  WHERE us.is_active = true
    AND us.last_heartbeat < NOW() - v_stale_threshold;

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
-- 6. Function: Get active sessions for user (for debugging/admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_active_sessions()
RETURNS TABLE (
  session_id TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  is_current BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    us.session_id,
    us.device_info,
    us.created_at,
    us.last_heartbeat,
    us.is_active as is_current
  FROM user_sessions us
  WHERE us.user_id = v_user_id
    AND us.is_active = true
  ORDER BY us.last_heartbeat DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_active_sessions TO authenticated;

-- ============================================================================
-- 7. Setup pg_cron job for automatic cleanup (if pg_cron is available)
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- You can enable it in Supabase Dashboard: Database > Extensions > pg_cron
-- Uncomment the following lines if you have pg_cron enabled:

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- SELECT cron.schedule(
--   'cleanup-stale-sessions',
--   '*/5 * * * *',
--   $$SELECT cleanup_stale_sessions();$$
-- );

-- ============================================================================
-- 8. Create trigger to log session invalidations (optional, for debugging)
-- ============================================================================

-- Create audit log table for session events (optional)
CREATE TABLE IF NOT EXISTS user_sessions_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'created', 'invalidated', 'heartbeat', 'expired'
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sessions_audit_user ON user_sessions_audit(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE user_sessions_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can view own session audit logs" ON user_sessions_audit;

-- Policy for viewing own audit logs
CREATE POLICY "Users can view own session audit logs"
  ON user_sessions_audit
  FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger function to log session events
CREATE OR REPLACE FUNCTION log_session_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log when session is created
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    INSERT INTO user_sessions_audit (user_id, session_id, event_type, device_info)
    VALUES (NEW.user_id, NEW.session_id, 'created', NEW.device_info);
  END IF;

  -- Log when session is invalidated
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO user_sessions_audit (user_id, session_id, event_type, device_info)
    VALUES (OLD.user_id, OLD.session_id, 'invalidated', OLD.device_info);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_session_events ON user_sessions;
CREATE TRIGGER trigger_log_session_events
  AFTER INSERT OR UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_session_event();

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Session management system installed successfully!';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '  - create_new_session(user_id, session_id, device_info)';
  RAISE NOTICE '  - update_session_heartbeat(session_id)';
  RAISE NOTICE '  - cleanup_stale_sessions()';
  RAISE NOTICE '  - get_user_active_sessions()';
END $$;
