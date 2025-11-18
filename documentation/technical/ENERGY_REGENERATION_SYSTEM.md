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

### Energy Not Syncing from Cron Job

**Problem**: Cron job adds energy in DB, but frontend doesn't update

**Symptom**: Energy in DB is higher than in game UI, only syncs after F5

**Cause**: Old logic completely ignored DB energy in Realtime updates

**Solution**: ✅ **FIXED** - Smart sync logic (as of 2025-11-18)

New logic accepts DB energy ONLY when it's higher than local (cron regeneration).

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

### Realtime Updates - Smart Energy Sync

**Energy uses SMART SYNC LOGIC** in Realtime updates (as of 2025-11-18):

```typescript
// src/hooks/useGameState.ts - Lines 872-893
// ENERGY SYNC LOGIC:
// 1. If DB energy > local energy: Accept DB value (cron job regeneration)
// 2. If DB energy <= local energy: Keep local value (avoid autosave overwrite)
// 3. If maxEnergy increased: Add the difference (bank upgrade bonus)

const maxEnergyDiff = calculatedMaxEnergy - prev.maxEnergy;
let finalEnergy = prev.energy;

// Case 1: Bank upgrade - add bonus to current energy
if (maxEnergyDiff > 0) {
  finalEnergy = prev.energy + maxEnergyDiff;
  console.log(`⚡ Bank upgrade! MaxEnergy: ${prev.maxEnergy} → ${calculatedMaxEnergy}`);
}
// Case 2: DB energy is higher - accept it (cron job regeneration)
else if (updatedProfile.energy > prev.energy) {
  finalEnergy = updatedProfile.energy;
  console.log(`🔋 Energy regenerated! DB (${updatedProfile.energy}) > Local (${prev.energy})`);
}
// Case 3: Local energy is higher or equal - keep local
else {
  console.log(`🔄 Realtime update - keeping local energy (${prev.energy})`);
}

return {
  ...prev,
  energy: finalEnergy,  // Smart sync!
  // ... rest of state
};
```

**Why smart sync is needed**:
- ✅ Accepts cron job regeneration (DB > local)
- ✅ Prevents autosave race condition (DB <= local)
- ✅ Preserves local energy changes (spending/movement)
- ✅ Handles bank upgrade bonus correctly
- ✅ Works with multiple tabs open

**When energy syncs**:
- ✅ **Cron job regeneration** - Accepted if DB > local (Realtime)
- ✅ **Bank upgrade** - Bonus added to current energy (Realtime)
- ✅ **Page reload/refresh** - Fresh load from DB
- ✅ **Login/Initial load** - Fresh load from DB
- ❌ **Autosave overwrite** - Prevented by keeping local if DB <= local

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

**Q: Will my energy update automatically when cron runs?**
A: Yes! The smart sync logic (added 2025-11-18) accepts DB energy if it's higher than local. You'll see `🔋 Energy regenerated!` in console and UI updates automatically via Realtime.

**Q: What if I'm spending energy at the same time as cron runs?**
A: No problem! If your local energy is lower due to spending, cron job increase will be accepted. If higher, local value is kept to preserve your actions.

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
