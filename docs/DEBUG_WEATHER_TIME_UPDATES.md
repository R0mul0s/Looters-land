# Debug: Weather & Time Not Updating

## 🔍 Current Problem

Weather and time countdown reaches 0 but doesn't automatically update.

## 📊 Analysis of Current Data (11:50 状況)

### Database State (from SQL queries):

```
weather_transition_start: 2025-11-13 11:15:01.948+00
weather_duration: 37 minutes
→ Weather should change at: 11:15 + 37 = 11:52

time_transition_start: 2025-11-13 11:30:07.585+00
time_duration: 19 minutes
→ Time should change at: 11:30 + 19 = 11:49

updated_at: 2025-11-13 11:30:07.666462+00
```

### Cron Job Status:
- Last run: **2025-11-13 11:50:00**
- Status: **succeeded**

### Expected Behavior:
At 11:50:00 (when cron ran):
- ✅ Time **SHOULD** have updated (11:49 < 11:50)
- ❌ Weather **should NOT** update yet (11:52 > 11:50)

### Actual Behavior:
- `updated_at` is still **11:30:07** (20 minutes old)
- This means the Edge Function did NOT update the database

## 🚨 Root Cause

**The Edge Function is not executing or not updating the database properly.**

Possible reasons:
1. Edge Function URL is incorrect in cron job
2. Authorization header is incorrect
3. Edge Function is throwing an error silently
4. RLS policy is blocking the update (unlikely with service_role)

## 🔧 Debugging Steps

### Step 1: Check Cron Job Command

Run this SQL to see the exact command:

```sql
SELECT command FROM cron.job WHERE jobid = 4;
```

**Expected output should be:**
```sql
SELECT
  net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/update-global-world-state',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  ) AS request_id;
```

**Check:**
- ✅ URL matches your project
- ✅ Authorization header has correct SERVICE_ROLE_KEY
- ✅ Function name is spelled correctly

### Step 2: Check Edge Function Logs

In Supabase Dashboard:
1. Go to **Edge Functions** → **update-global-world-state**
2. Click **Logs** tab
3. Look for recent invocations around **11:50:00**

**What to look for:**
- ✅ Function was called: `"Function invoked"`
- ✅ No errors: No red error messages
- ✅ Update message: `"⏭️ No transitions needed yet"` OR `"✅ Global world state updated successfully"`

### Step 3: Manual Test Edge Function

Test the function manually to see if it works:

```bash
curl -X POST \
  'https://<PROJECT_REF>.supabase.co/functions/v1/update-global-world-state' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>' \
  -H 'Content-Type: application/json'
```

**Expected response:**
```json
{
  "success": true,
  "message": "No transitions needed"
  // OR "Global world state updated"
}
```

After running this, check if `updated_at` changed in the database:

```sql
SELECT updated_at FROM global_world_state WHERE id = 1;
```

### Step 4: Check Cron Job History with Details

```sql
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = 4
ORDER BY start_time DESC
LIMIT 5;
```

**Look for:**
- `return_message` - should show response from Edge Function
- `status` - should be 'succeeded'
- Any error messages

### Step 5: Check if pg_net is Working

```sql
-- Test pg_net with a simple request
SELECT
  net.http_post(
    url := 'https://httpbin.org/post',
    body := '{"test": "hello"}'::jsonb
  ) AS request_id;
```

If this fails, pg_net is not working properly.

### Step 6: Force Time Transition for Testing

Set time to expire in 1 minute for testing:

```sql
UPDATE global_world_state
SET
  time_transition_start = NOW(),
  time_duration = 1  -- Will expire in 1 minute
WHERE id = 1;
```

Wait 2 minutes, then check if it updated:

```sql
SELECT
  time_current,
  time_next,
  time_transition_start,
  time_duration,
  updated_at
FROM global_world_state
WHERE id = 1;
```

## 🐛 Common Issues and Fixes

### Issue 1: Wrong Edge Function URL

**Symptom:** Cron job succeeds but nothing happens

**Fix:** Get correct URL from Dashboard → Settings → API → Project URL

```sql
-- Update cron job with correct URL
SELECT cron.unschedule('update-global-world-state');

SELECT cron.schedule(
  'update-global-world-state',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://<CORRECT_PROJECT_REF>.supabase.co/functions/v1/update-global-world-state',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

### Issue 2: Wrong Authorization Key

**Symptom:** Edge Function logs show 401/403 errors

**Fix:** Use SERVICE_ROLE_KEY (not anon key) from Dashboard → Settings → API

```sql
-- Update cron job with correct key
SELECT cron.unschedule('update-global-world-state');

SELECT cron.schedule(
  'update-global-world-state',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/update-global-world-state',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <CORRECT_SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

### Issue 3: Edge Function Not Deployed

**Symptom:** 404 errors in logs

**Fix:** Deploy the Edge Function

```bash
supabase functions deploy update-global-world-state
```

### Issue 4: RLS Policy Blocking Update

**Symptom:** Edge Function runs but database doesn't update

**Fix:** Ensure service_role policy exists:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'global_world_state';

-- Create/recreate service role policy
DROP POLICY IF EXISTS "Allow service role to update global world state" ON global_world_state;

CREATE POLICY "Allow service role to update global world state"
  ON global_world_state
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## ✅ Verification Checklist

After fixing, verify:

- [ ] Edge Function logs show successful invocations
- [ ] `updated_at` timestamp changes after cron runs
- [ ] Weather/time transitions when duration expires
- [ ] Frontend receives Realtime updates (check browser console for `🌍 Global world state updated`)

## 📝 Additional Notes

**Edge Function Update Logic:**
- Function runs every 15 minutes via cron
- Checks if `NOW() >= transition_start + duration`
- If yes: Updates to next state, sets new random duration
- If no: Returns "No transitions needed" and does NOT update database

**Why `updated_at` Might Not Change:**
The Edge Function ONLY updates the database when a transition occurs. If no weather/time changes are needed, it returns early without updating. This is correct behavior.

However, in your case at 11:50:00:
- Time SHOULD have transitioned (11:49 < 11:50)
- So the database SHOULD have been updated
- But `updated_at` is still 11:30

This confirms the Edge Function is NOT being called or NOT executing properly.

---

**Author:** Claude Code Assistant
**Created:** 2025-11-13
**Last Updated:** 2025-11-13
