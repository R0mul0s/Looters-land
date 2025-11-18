# Energy Regeneration System

**Status**: ✅ Active
**Version**: 2.0 (Database Cron)
**Last Updated**: 2025-11-18
**Author**: Roman Hlaváček - rhsoft.cz

---

## Overview

Energy regeneration system provides automatic energy recovery for players at a rate of **10 energy per hour**.

**Current Implementation**: Server-side cron job (v2.0)
**Previous Implementation**: Frontend hook (v1.0) - **DEPRECATED**

---

## How It Works

### Server-Side Regeneration (Current)

Energy regeneration is handled by a **PostgreSQL cron job** that runs every hour.

**Key Components**:
1. **SQL Function**: `regenerate_player_energy()`
2. **Cron Job**: Runs every hour at `:00` minutes
3. **Migration**: `20251118_add_hourly_energy_regen.sql`

**Process**:
```sql
-- Every hour at :00 (e.g., 13:00, 14:00, 15:00)
UPDATE player_profiles
SET
  energy = LEAST(energy + 10, max_energy),
  updated_at = NOW()
WHERE
  energy < max_energy
  AND user_id != '00000000-0000-0000-0000-000000000000';
```

**Features**:
- ✅ Consistent regeneration for all players
- ✅ Works even when game is closed (offline regeneration)
- ✅ No duplicate regeneration in multiple tabs
- ✅ No race conditions with Realtime updates
- ✅ Automatic capping at `max_energy`

---

## Configuration

### Energy Settings

Location: `src/config/BALANCE_CONFIG.ts`

```typescript
export const ENERGY_CONFIG = {
  /** Energy regeneration rate per hour */
  REGEN_RATE: 10,

  /** Maximum energy capacity (24 hours worth at 10/hour) */
  MAX_ENERGY: 240,

  /** Energy cost for entering a dungeon */
  DUNGEON_ENTRY_COST: 10,
}
```

### Bank Vault Energy Bonus

Players can increase their max energy by upgrading Bank Vault:

| Tier | Max Slots | Energy Bonus | Total Max Energy |
|------|-----------|--------------|------------------|
| 0    | 0         | 0            | 240              |
| 1    | 50        | +25          | 265              |
| 2    | 100       | +50          | 290              |
| 3    | 150       | +75          | 315              |
| 4    | 200       | +100         | 340              |
| 5    | 250       | +125         | 365              |

---

## Setup Instructions

### 1. Apply Migration

Run in Supabase SQL Editor:

```bash
supabase/migrations/20251118_add_hourly_energy_regen.sql
```

This creates:
- `regenerate_player_energy()` function
- Hourly cron job at `:00` minutes

### 2. Verify Setup

Check if cron job was created:

```sql
SELECT * FROM cron.job WHERE jobname = 'hourly-energy-regeneration';
```

Expected result:
```
jobname: hourly-energy-regeneration
schedule: 0 * * * *
active: true
```

### 3. Test Manually

Trigger regeneration immediately:

```sql
SELECT regenerate_player_energy();
```

Check result:

```sql
SELECT nickname, energy, max_energy, updated_at
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC;
```

---

## Daily Reset Integration

Energy is also reset to maximum during daily reset at midnight UTC.

**Function**: `reset_daily_data()`
**Migration**: `20251110000002_create_reset_daily_data_function.sql`

```sql
UPDATE player_profiles
SET
  energy = max_energy,
  world_map_data = NULL,
  discovered_locations = '[]'::jsonb,
  updated_at = NOW()
WHERE user_id != '00000000-0000-0000-0000-000000000000';
```

---

## Troubleshooting

### Energy Auto-Regenerating in UI

**Problem**: Energy increases automatically while playing (not from cron)

**Symptom**: Logs show `ACCEPTING higher energy from DB` frequently

**Cause**: Multiple tabs open + Realtime updates accepting DB energy

**Solution**: ✅ **FIXED** - Energy is now ignored in Realtime updates (as of 2025-11-18)

Energy will only sync on page reload, preventing auto-regeneration issues.

### Duplicate Regeneration (Energy +20 instead of +10)

**Problem**: Multiple cron jobs executing simultaneously

**Solution**: Run cleanup script

```bash
supabase/cleanup_duplicate_energy_crons.sql
```

This will:
1. Remove all `hourly-energy-regeneration` jobs
2. Create exactly ONE new job
3. Verify only one job exists

### Cron Job Not Running

**Check if pg_cron is enabled**:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

If not enabled, enable via Supabase Dashboard:
- Go to **Database** → **Extensions**
- Enable `pg_cron`

**Check job status**:

```sql
SELECT * FROM cron.job WHERE jobname = 'hourly-energy-regeneration';
```

**Check execution history**:

```sql
SELECT
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'hourly-energy-regeneration')
ORDER BY start_time DESC
LIMIT 10;
```

### Energy Not Regenerating

**Manual trigger test**:

```sql
SELECT regenerate_player_energy();
```

**Check logs** for NOTICE messages:
```
Hourly energy regeneration completed for X players
```

**Verify updated_at changes** after regeneration

---

## Frontend Integration

### Energy Display

Energy is displayed in game header with regen rate indicator:

```typescript
// src/components/GameLayout.tsx
<GameHeader
  energy={gameState.energy}
  maxEnergy={gameState.maxEnergy}
  energyRegenRate={10}  // Fixed value, no longer from hook
/>
```

### Realtime Updates

**Energy is IGNORED in Realtime updates** to prevent issues with multiple tabs:

```typescript
// src/hooks/useGameState.ts
// CRITICAL: IGNORE energy from Realtime updates!
// Energy changes locally (movement, spending) and should only save OUT to DB.
// Energy will be synced correctly on next page load when profile is fetched.
console.log(`🔄 Realtime profile update - IGNORING energy from DB, keeping local`);

return {
  ...prev,
  energy: prev.energy,  // ALWAYS keep local energy
  // ... rest of state
};
```

**Why energy is ignored in Realtime**:
- ✅ Prevents duplicate energy from multiple tabs
- ✅ Prevents race conditions with autosave
- ✅ Local energy is always authoritative
- ✅ DB energy syncs on page reload (fresh load from DB)

**When energy syncs**:
- ✅ Page reload/refresh - loads fresh energy from DB
- ✅ Login - loads energy from DB
- ✅ Initial load - loads energy from DB
- ❌ Realtime updates - **IGNORED** to prevent conflicts

---

## Migration History

### Version 2.0 (2025-11-18) - Current

**Implementation**: Database cron job
**Migration**: `20251118_add_hourly_energy_regen.sql`

**Changes**:
- ✅ Created `regenerate_player_energy()` function
- ✅ Setup hourly cron job
- ✅ Disabled frontend hook
- ✅ Fixed duplicate regeneration bug

**Benefits**:
- Offline regeneration
- No tab conflicts
- Consistent for all players

### Version 1.0 (2025-11-17) - DEPRECATED

**Implementation**: Frontend React hook
**File**: `src/hooks/useEnergyRegeneration.ts`

**Problems**:
- ❌ Duplicate regeneration in multiple tabs
- ❌ Only worked when game was open
- ❌ Race conditions with Realtime updates
- ❌ Inconsistent energy across sessions

**Status**: Hook marked as `@deprecated`, kept for reference

---

## Related Files

### Database
- `supabase/migrations/20251118_add_hourly_energy_regen.sql` - Main migration
- `supabase/migrations/20251110000002_create_reset_daily_data_function.sql` - Daily reset
- `supabase/cleanup_duplicate_energy_crons.sql` - Cleanup script
- `supabase/SETUP_HOURLY_ENERGY_REGEN.md` - Setup guide

### Frontend
- `src/config/BALANCE_CONFIG.ts` - Energy configuration
- `src/hooks/useGameState.ts` - Energy state management
- `src/hooks/useEnergyRegeneration.ts` - DEPRECATED frontend hook
- `src/components/GameLayout.tsx` - Energy display

### Documentation
- `documentation/technical/ENERGY_REGENERATION_SYSTEM.md` - This file
- `supabase/SETUP_HOURLY_ENERGY_REGEN.md` - Detailed setup guide

---

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Cron job created and active
- [ ] Manual trigger works (`SELECT regenerate_player_energy()`)
- [ ] Energy increases by 10 every hour
- [ ] Energy caps at max_energy (doesn't exceed)
- [ ] updated_at timestamp updates correctly
- [ ] Multiple tabs don't cause duplicate regeneration
- [ ] Energy regenerates when player is offline
- [ ] Daily reset sets energy to maximum
- [ ] Bank Vault upgrades increase max energy correctly

---

## FAQ

**Q: Why did we move from frontend to backend regeneration?**
A: Frontend hook caused duplicate regeneration in multiple tabs and didn't work offline.

**Q: What happens if I have the game open in 3 tabs?**
A: Energy regenerates only once per hour (server-side), no duplicates.

**Q: Does energy regenerate when I'm not playing?**
A: Yes! The cron job runs every hour regardless of whether you're online.

**Q: What if my energy is already at maximum?**
A: The cron job skips you (optimization). No unnecessary updates.

**Q: Can I change the regeneration rate?**
A: Yes, modify `ENERGY_CONFIG.REGEN_RATE` in `BALANCE_CONFIG.ts` and update the SQL function.

**Q: How do I disable energy regeneration?**
A: Run `SELECT cron.unschedule('hourly-energy-regeneration');` in SQL Editor.

**Q: What about the old useEnergyRegeneration hook?**
A: It's deprecated but kept in codebase. Don't use it. It's marked with `@deprecated`.

**Q: Why doesn't my energy update immediately when cron runs?**
A: Energy from DB is ignored in Realtime updates to prevent conflicts. Refresh the page to see updated energy.

**Q: I see duplicate "ACCEPTING higher energy" logs - is that a problem?**
A: That was a bug (fixed 2025-11-18). Energy is now ignored in Realtime, preventing duplicates.

---

## Support

For issues or questions:
- Check logs: Supabase Dashboard → Database → Cron Jobs
- Run diagnostics: `supabase/cleanup_duplicate_energy_crons.sql`
- Review setup: `supabase/SETUP_HOURLY_ENERGY_REGEN.md`

---

**Status**: ✅ Production Ready
**Performance**: Optimized (only updates players below max energy)
**Reliability**: High (PostgreSQL cron with error handling)
