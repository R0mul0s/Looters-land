# Setup Hourly Energy Regeneration

This guide explains how to setup automatic hourly energy regeneration using Supabase cron jobs.

## Overview

- **What**: Automatically regenerates 10 energy per hour for all players
- **When**: Every hour at :00 minutes (e.g., 13:00, 14:00, 15:00)
- **How**: PostgreSQL cron job using pg_cron extension

## Prerequisites

- Supabase project with `pg_cron` extension enabled
- Database access via Supabase Dashboard SQL Editor

## Installation Steps

### 1. Apply Migration

Open Supabase Dashboard → SQL Editor and run the migration file:

```bash
supabase/migrations/20251118_add_hourly_energy_regen.sql
```

Or copy-paste the SQL into the SQL Editor and execute.

### 2. Verify Setup

Check if the cron job was created:

```sql
SELECT * FROM cron.job WHERE jobname = 'hourly-energy-regeneration';
```

You should see:
- `jobname`: hourly-energy-regeneration
- `schedule`: 0 * * * *
- `active`: true

### 3. Test Manually

Trigger energy regeneration immediately for testing:

```sql
SELECT regenerate_player_energy();
```

Check the result in player_profiles:

```sql
SELECT
  user_id,
  nickname,
  energy,
  max_energy,
  updated_at
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC;
```

## How It Works

### Energy Regeneration Logic

```sql
UPDATE player_profiles
SET
  energy = LEAST(energy + 10, max_energy),
  updated_at = NOW()
WHERE
  energy < max_energy
  AND user_id != '00000000-0000-0000-0000-000000000000';
```

- Adds **10 energy** per hour
- **Caps at max_energy** (won't exceed maximum)
- **Skips players** who are already at max energy (optimization)
- **Updates timestamp** to track last regeneration

### Cron Schedule

```
0 * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

`0 * * * *` = Every hour at minute 0

## Monitoring

### Check Recent Executions

```sql
SELECT
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-energy-regeneration')
ORDER BY start_time DESC
LIMIT 10;
```

### Check Logs

Look for NOTICE messages in PostgreSQL logs:
```
Hourly energy regeneration completed for X players
```

## Troubleshooting

### Cron Job Not Running

1. **Check if pg_cron is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **If not enabled**, contact Supabase support or enable via dashboard:
   - Go to Database → Extensions
   - Enable `pg_cron`

3. **Check job status:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'hourly-energy-regeneration';
   ```

### Energy Not Regenerating

1. **Manually trigger** to test:
   ```sql
   SELECT regenerate_player_energy();
   ```

2. **Check player energy levels** before and after:
   ```sql
   SELECT nickname, energy, max_energy FROM player_profiles;
   ```

3. **Verify updated_at** changes after regeneration

## Disabling/Removing

To disable the cron job:

```sql
SELECT cron.unschedule('hourly-energy-regeneration');
```

To remove the function:

```sql
DROP FUNCTION IF EXISTS regenerate_player_energy();
```

## Frontend Changes

The frontend energy regeneration hook (`useEnergyRegeneration`) has been **disabled** to prevent:
- Duplicate regeneration in multiple browser tabs
- Inconsistent energy values between tabs
- Race conditions during autosave

Energy now regenerates **server-side only** via cron job.

## Related Files

- Migration: `supabase/migrations/20251118_add_hourly_energy_regen.sql`
- Frontend: `src/components/WorldMap.tsx` (hook disabled)
- Hook: `src/hooks/useEnergyRegeneration.ts` (no longer used)
- Config: `src/config/BALANCE_CONFIG.ts` (ENERGY_CONFIG.REGEN_RATE = 10)

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Cron job created and active
- [ ] Manual trigger works (`SELECT regenerate_player_energy()`)
- [ ] Energy increases by 10 every hour
- [ ] Energy caps at max_energy
- [ ] updated_at timestamp updates correctly
- [ ] Multiple tabs don't cause duplicate regeneration
- [ ] Energy regenerates even when player is offline

---

**Author**: Roman Hlaváček - rhsoft.cz
**Created**: 2025-11-18
**Last Updated**: 2025-11-18
