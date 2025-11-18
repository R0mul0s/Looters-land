# Online Status System - Deployment Guide

## Quick Start

Deploy these migrations in **Supabase Dashboard → SQL Editor** in this order:

### 1. Update Session Functions (Required)
**File:** `20251118_add_online_status.sql`

```sql
-- Copy and paste the entire content of this file into SQL Editor and execute
```

**What it does:**
- Updates `update_session_heartbeat()` to set `is_online = true`
- Updates `cleanup_stale_sessions()` to set `is_online = false`
- Uses existing `is_online` column in `player_profiles` table

### 2. Setup Automatic Cleanup (Required)
**File:** `20251118_setup_session_cleanup_cron.sql`

```sql
-- Copy and paste the entire content of this file into SQL Editor and execute
```

**What it does:**
- Creates pg_cron job that runs every minute
- Automatically marks players offline after 5 minutes of inactivity
- Ensures browser close/crash detection works

## Verification

After deployment, verify everything works:

```sql
-- 1. Check if cron job is created
SELECT * FROM cron.job WHERE jobname = 'cleanup-stale-sessions';
-- Expected: 1 row with schedule '* * * * *'

-- 2. Manually test cleanup function
SELECT * FROM cleanup_stale_sessions();
-- Expected: Returns (cleaned_count, 'Cleanup completed')

-- 3. Check online players
SELECT nickname, is_online, last_seen
FROM player_profiles
WHERE is_online = true;
-- Expected: List of currently online players
```

## How It Works

### Timeline Example:

```
00:00 - Player logs in → is_online = true
00:05 - Heartbeat sent → last_heartbeat updated
00:10 - Heartbeat sent → last_heartbeat updated
...
05:00 - Player closes browser (no logout)
05:01 - Cron job runs → detects no heartbeat for 5 minutes → is_online = false
05:02 - Other players see offline badge
```

### Visual Indicators:

**Online Player:**
- Full color avatar
- Blue border on label

**Offline Player:**
- Grayscale avatar (50% opacity)
- Red pulsating badge with ⏸ icon
- Red border on label
- "(Offline)" text in red

## Configuration

### Change Timeout Period

Edit `cleanup_stale_sessions()` function:

```sql
-- Default: 5 minutes
v_stale_threshold := INTERVAL '5 minutes';

-- Change to 10 minutes:
v_stale_threshold := INTERVAL '10 minutes';
```

### Change Cron Frequency

```sql
-- Current: Every minute
SELECT cron.schedule('cleanup-stale-sessions', '* * * * *', ...);

-- Change to every 5 minutes:
SELECT cron.schedule('cleanup-stale-sessions', '*/5 * * * *', ...);
```

## Monitoring

### Monitor Cron Job Execution

```sql
-- View last 10 cron runs
SELECT
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'cleanup-stale-sessions'
)
ORDER BY start_time DESC
LIMIT 10;
```

### Check Active Sessions

```sql
SELECT
  pp.nickname,
  us.is_active,
  us.last_heartbeat,
  NOW() - us.last_heartbeat as time_since_heartbeat
FROM user_sessions us
JOIN player_profiles pp ON pp.user_id::text = us.user_id::text
WHERE us.is_active = true
ORDER BY us.last_heartbeat DESC;
```

## Troubleshooting

### Cron job not running

**Symptom:** Players never marked as offline automatically

**Solution:**
```sql
-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If not found, enable it:
CREATE EXTENSION pg_cron;

-- Re-run the cron setup migration
```

### Too many false offline alerts

**Symptom:** Players marked offline even though they're active

**Solution:**
- Increase timeout period (default 5 minutes may be too short)
- Check network stability (heartbeats may be failing)
- Verify frontend heartbeat interval (should be < 5 minutes)

### Players stuck as offline

**Symptom:** Players remain offline even after login

**Solution:**
```sql
-- Manually reset player status
UPDATE player_profiles
SET is_online = true, last_seen = NOW()
WHERE user_id = 'USER_ID_HERE';

-- Check if heartbeat function is working
SELECT * FROM update_session_heartbeat('session_id_here');
```

## Uninstall

To remove the online status system:

```sql
-- 1. Stop cron job
SELECT cron.unschedule('cleanup-stale-sessions');

-- 2. Reset all players to offline
UPDATE player_profiles SET is_online = false;

-- 3. (Optional) Remove functions
DROP FUNCTION IF EXISTS update_session_heartbeat(TEXT);
DROP FUNCTION IF EXISTS cleanup_stale_sessions();
```

## Related Documentation

- **Full Documentation:** [docs/ONLINE_STATUS_SYSTEM.md](../../docs/ONLINE_STATUS_SYSTEM.md)
- **Session Management:** [docs/SESSION_MANAGEMENT.md](../../docs/SESSION_MANAGEMENT.md)
- **Test Suite:** [TEST_SESSION_MANAGEMENT.sql](../TEST_SESSION_MANAGEMENT.sql)

## Support

Created by: Roman Hlaváček - rhsoft.cz
Date: 2025-11-18
