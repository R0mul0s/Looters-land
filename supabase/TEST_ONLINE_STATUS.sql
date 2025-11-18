/**
 * Online Status System - Test Script
 *
 * This script tests the online status tracking system including:
 * - Online/offline status updates
 * - Cron job functionality
 * - Automatic cleanup of stale sessions
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @created 2025-11-18
 */

-- ============================================================================
-- Test 1: Verify Cron Job is Installed
-- ============================================================================

SELECT '=== Test 1: Verify Cron Job ===' as test_step;

DO $$
DECLARE
  v_job_count INTEGER;
  v_result RECORD;
BEGIN
  -- Check if cron job exists
  SELECT COUNT(*) INTO v_job_count
  FROM cron.job
  WHERE jobname = 'cleanup-stale-sessions';

  IF v_job_count = 0 THEN
    RAISE NOTICE '❌ FAILED: Cron job not found!';
    RAISE NOTICE 'Run migration: 20251118_setup_session_cleanup_cron.sql';
  ELSE
    RAISE NOTICE '✅ SUCCESS: Cron job found';

    -- Show cron job details
    FOR v_result IN
      SELECT jobname, schedule, active, database
      FROM cron.job
      WHERE jobname = 'cleanup-stale-sessions'
    LOOP
      RAISE NOTICE '  Name: %', v_result.jobname;
      RAISE NOTICE '  Schedule: %', v_result.schedule;
      RAISE NOTICE '  Active: %', v_result.active;
      RAISE NOTICE '  Database: %', v_result.database;
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- Test 2: Test Cleanup Function
-- ============================================================================

SELECT '=== Test 2: Test Cleanup Function ===' as test_step;

DO $$
DECLARE
  v_result RECORD;
BEGIN
  RAISE NOTICE 'Running cleanup_stale_sessions()...';

  -- Execute cleanup function
  FOR v_result IN
    SELECT * FROM cleanup_stale_sessions()
  LOOP
    RAISE NOTICE '✅ Cleanup successful';
    RAISE NOTICE '  Cleaned sessions: %', v_result.cleaned_count;
    RAISE NOTICE '  Message: %', v_result.message;
  END LOOP;
END $$;

-- ============================================================================
-- Test 3: Create Test Player and Simulate Activity
-- ============================================================================

SELECT '=== Test 3: Simulate Player Activity ===' as test_step;

DO $$
DECLARE
  test_user_id UUID;
  test_session_id TEXT := 'test-online-status-' || extract(epoch from now())::text;
  v_player_id UUID;
BEGIN
  -- Get a real test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️ No users found - create a user first';
    RETURN;
  END IF;

  RAISE NOTICE 'Using test user: %', test_user_id;

  -- Create test session
  INSERT INTO user_sessions (user_id, session_id, device_info, is_active, last_heartbeat)
  VALUES (
    test_user_id,
    test_session_id,
    '{"userAgent": "Test Browser", "platform": "Test"}'::jsonb,
    true,
    NOW()
  );

  RAISE NOTICE '✅ Created test session: %', test_session_id;

  -- Get player profile ID
  SELECT id INTO v_player_id
  FROM player_profiles
  WHERE user_id::text = test_user_id::text;

  -- Simulate heartbeat update (should set is_online = true)
  PERFORM update_session_heartbeat(test_session_id);

  -- Check player status
  SELECT is_online INTO v_player_id
  FROM player_profiles
  WHERE user_id::text = test_user_id::text;

  IF v_player_id THEN
    RAISE NOTICE '✅ Player marked as ONLINE';
  ELSE
    RAISE NOTICE '❌ Player NOT marked as online!';
  END IF;

  -- Now simulate stale session (6 minutes old)
  UPDATE user_sessions
  SET last_heartbeat = NOW() - INTERVAL '6 minutes'
  WHERE session_id = test_session_id;

  RAISE NOTICE 'Set session to stale (6 minutes old)';

  -- Run cleanup
  PERFORM cleanup_stale_sessions();

  -- Check if player is now offline
  SELECT is_online INTO v_player_id
  FROM player_profiles
  WHERE user_id::text = test_user_id::text;

  IF NOT v_player_id THEN
    RAISE NOTICE '✅ Player correctly marked as OFFLINE after timeout';
  ELSE
    RAISE NOTICE '❌ Player still online after timeout!';
  END IF;

  -- Cleanup test session
  DELETE FROM user_sessions WHERE session_id = test_session_id;
  RAISE NOTICE 'Cleaned up test session';
END $$;

-- ============================================================================
-- Test 4: Check Current Online Players
-- ============================================================================

SELECT '=== Test 4: Current Online Players ===' as test_step;

DO $$
DECLARE
  v_result RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Online players:';

  FOR v_result IN
    SELECT
      nickname,
      is_online,
      last_seen,
      NOW() - last_seen as time_since_last_seen
    FROM player_profiles
    WHERE is_online = true
    ORDER BY last_seen DESC
  LOOP
    v_count := v_count + 1;
    RAISE NOTICE '  % - % (last seen: %)', v_result.nickname,
      CASE WHEN v_result.is_online THEN 'ONLINE' ELSE 'OFFLINE' END,
      v_result.time_since_last_seen;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '  No online players found';
  ELSE
    RAISE NOTICE 'Total online: %', v_count;
  END IF;
END $$;

-- ============================================================================
-- Test 5: Check Active Sessions
-- ============================================================================

SELECT '=== Test 5: Active Sessions ===' as test_step;

DO $$
DECLARE
  v_result RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Active sessions with heartbeat status:';

  FOR v_result IN
    SELECT
      pp.nickname,
      us.session_id,
      us.is_active,
      us.last_heartbeat,
      NOW() - us.last_heartbeat as heartbeat_age
    FROM user_sessions us
    JOIN player_profiles pp ON pp.user_id::text = us.user_id::text
    WHERE us.is_active = true
    ORDER BY us.last_heartbeat DESC
    LIMIT 10
  LOOP
    v_count := v_count + 1;
    RAISE NOTICE '  % - Session age: % (active: %)',
      v_result.nickname,
      v_result.heartbeat_age,
      v_result.is_active;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '  No active sessions found';
  ELSE
    RAISE NOTICE 'Total active sessions: %', v_count;
  END IF;
END $$;

-- ============================================================================
-- Test 6: Check Cron Job History
-- ============================================================================

SELECT '=== Test 6: Cron Job Execution History ===' as test_step;

DO $$
DECLARE
  v_result RECORD;
  v_job_id BIGINT;
  v_count INTEGER := 0;
BEGIN
  -- Get job ID
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'cleanup-stale-sessions';

  IF v_job_id IS NULL THEN
    RAISE NOTICE '⚠️ Cron job not found';
    RETURN;
  END IF;

  RAISE NOTICE 'Last 5 cron job executions:';

  FOR v_result IN
    SELECT
      runid,
      start_time,
      end_time,
      status,
      return_message
    FROM cron.job_run_details
    WHERE jobid = v_job_id
    ORDER BY start_time DESC
    LIMIT 5
  LOOP
    v_count := v_count + 1;
    RAISE NOTICE '  Run #%: % - Status: %',
      v_result.runid,
      v_result.start_time,
      v_result.status;

    IF v_result.return_message IS NOT NULL THEN
      RAISE NOTICE '    Message: %', v_result.return_message;
    END IF;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '  No execution history yet (cron job will run in next minute)';
  ELSE
    RAISE NOTICE 'Total runs found: %', v_count;
  END IF;
END $$;

-- ============================================================================
-- Test Summary
-- ============================================================================

SELECT '=== Test Summary ===' as test_step;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'ONLINE STATUS SYSTEM TEST COMPLETE';
  RAISE NOTICE '======================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What to check:';
  RAISE NOTICE '1. ✅ Cron job is installed and active';
  RAISE NOTICE '2. ✅ Cleanup function executes without errors';
  RAISE NOTICE '3. ✅ Players marked online when heartbeat sent';
  RAISE NOTICE '4. ✅ Players marked offline after 5 minutes timeout';
  RAISE NOTICE '5. ✅ Cron job runs every minute automatically';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test in-game: Login and check if you appear as online';
  RAISE NOTICE '2. Test logout: Logout and verify offline badge appears';
  RAISE NOTICE '3. Test timeout: Close browser without logout, wait 5-6 minutes';
  RAISE NOTICE '4. Monitor cron job: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;';
  RAISE NOTICE '';
END $$;

/*
EXPECTED RESULTS:
=================

Test 1: ✅ Cron job found with schedule '* * * * *'
Test 2: ✅ Cleanup function executes successfully
Test 3: ✅ Player marked online, then offline after timeout
Test 4: Shows list of currently online players
Test 5: Shows active sessions with heartbeat age
Test 6: Shows recent cron job executions (if any)

TROUBLESHOOTING:
================

If Test 1 fails:
- Run migration: 20251118_setup_session_cleanup_cron.sql

If Test 2 fails:
- Check function exists: \df cleanup_stale_sessions
- Run migration: 20251118_add_online_status.sql

If Test 3 fails:
- Check if is_online column exists in player_profiles
- Verify update_session_heartbeat function is updated

If Test 6 shows no history:
- Wait 1-2 minutes for first cron execution
- Check cron.job table: SELECT * FROM cron.job;
*/
