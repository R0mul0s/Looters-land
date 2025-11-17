# How to Check Daily Reset Status

## Step 1: Check if the Migration is Deployed

First, you need to deploy the fix. Open Supabase Dashboard SQL Editor and run this query to check if the new functions exist:

```sql
-- Check if the new functions exist
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('calculate_bank_energy_bonus', 'reset_daily_data');
```

If you don't see both functions or the `calculate_bank_energy_bonus` function doesn't exist, you need to deploy the migration.

## Step 2: Deploy the Fix (if needed)

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ykkjdsciiztoeqycxmtg
2. Open SQL Editor
3. Copy the entire content of `supabase/migrations/20251116_fix_daily_reset_energy.sql`
4. Paste and click "Run"

## Step 3: Check Cron Job Status

Run this query to verify the cron job is configured:

```sql
-- Check cron job configuration
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database,
  command
FROM cron.job
WHERE jobname = 'daily-reset-trigger';
```

Expected result:
- `jobname`: daily-reset-trigger
- `schedule`: 0 0 * * * (runs at 00:00 UTC = 01:00 Czech time)
- `active`: true

## Step 4: Check Cron Job Execution History

Run this to see when the cron job last ran:

```sql
-- Check execution history
SELECT
  jr.jobid,
  j.jobname,
  jr.status,
  jr.return_message,
  jr.start_time AT TIME ZONE 'Europe/Prague' AS start_time_czech,
  jr.end_time AT TIME ZONE 'Europe/Prague' AS end_time_czech,
  EXTRACT(EPOCH FROM (jr.end_time - jr.start_time)) AS duration_seconds
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'daily-reset-trigger'
ORDER BY jr.start_time DESC
LIMIT 10;
```

This shows you:
- When the job last ran (in Czech time)
- Whether it succeeded or failed
- Any error messages

## Step 5: Check Your Current Profile State

```sql
-- Check your current profile
SELECT
  user_id,
  energy,
  max_energy AS cached_max_energy,
  bank_vault_tier,
  240 + calculate_bank_energy_bonus(COALESCE(bank_vault_tier, 0)) AS correct_max_energy,
  world_map_data IS NULL AS map_was_cleared,
  discovered_locations,
  updated_at AT TIME ZONE 'Europe/Prague' AS last_updated_czech
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC
LIMIT 5;
```

This shows:
- Your current energy
- Your bank vault tier
- What your max energy SHOULD be (correct_max_energy)
- Whether the map was cleared (should be NULL after reset)
- When the profile was last updated

## Step 6: Check Edge Function Logs

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ykkjdsciiztoeqycxmtg/functions/daily-reset/logs
2. Look for logs around 01:00 Czech time
3. You should see messages like:
   - "🔄 Starting daily reset..."
   - "✅ Energy restored and world maps reset for all players"

## Step 7: Manual Test (Optional)

If you want to test the reset immediately:

```sql
-- This will reset your energy and clear your map NOW
SELECT reset_daily_data();
```

Then check your profile again:

```sql
SELECT
  energy,
  bank_vault_tier,
  world_map_data IS NULL AS map_cleared,
  discovered_locations
FROM player_profiles
WHERE user_id = (SELECT auth.uid());
```

## Troubleshooting

### Issue: Map didn't regenerate
**Possible causes:**
1. The migration wasn't deployed yet (old broken function still running)
2. The cron job didn't execute (check execution history)
3. The Edge Function failed (check function logs)

### Issue: Energy is wrong
**Check:**
- Your bank_vault_tier value
- Run: `SELECT calculate_bank_energy_bonus(3);` (should return 75 for tier 3)
- Expected max energy = 240 + bonus

### Issue: Cron job isn't running
**Fix:**
1. The cron job might need to be recreated
2. Run the entire `MANUAL_SETUP_DAILY_RESET.sql` script again
3. Verify with the status queries above

## Next Steps

1. Run the queries above to diagnose the current state
2. Deploy the migration if you haven't already
3. Wait for the next daily reset at 01:00 Czech time
4. Or manually test with `SELECT reset_daily_data();`
