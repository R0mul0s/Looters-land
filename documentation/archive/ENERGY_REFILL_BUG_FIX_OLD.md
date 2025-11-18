# Energy Auto-Refill Bug Fix

**Author:** Roman Hlaváček - rhsoft.cz
**Copyright:** 2025
**Created:** 2025-11-17
**Status:** ✅ Fixed

---

## Problem Summary

Energy was automatically refilling after being deducted during player movement on the world map. This happened inconsistently - sometimes immediately, sometimes after several moves.

### Symptoms
- Player moves → energy decreases correctly
- After a few seconds or moves → energy jumps back up (not always to full)
- Example: Energy drops from 98 → 71, then suddenly jumps to 98
- Sometimes smaller jumps: 151 → 163 (+12 points)

---

## Root Causes

Two separate bugs were identified and fixed:

### Bug #1: Energy Regeneration Using Stale Values

**File:** `src/hooks/useEnergyRegeneration.ts:90`

**Problem:**
```typescript
// ❌ OLD CODE - Using absolute value with stale closure
const newEnergy = Math.min(max, current + energyToAdd);
const flooredEnergy = Math.floor(newEnergy);
onEnergyChangeRef.current(flooredEnergy); // Sets absolute value!
```

**What Happened:**
1. Energy regen reads `currentEnergyRef.current = 163`
2. Player moves quickly → energy drops to 151
3. Regen calculates: `newEnergy = 163 + 0.17 = 163` (floored)
4. Calls `setEnergy(163)` with the **old cached value**
5. Energy jumps from 151 back to 163! ⚠️

**Fix:**
```typescript
// ✅ NEW CODE - Using callback form with energy delta
const energyToAddFloored = Math.floor(energyToAdd);
if (energyToAddFloored >= 1) {
  console.log(`🔋 Energy regen: attempting to add ${energyToAddFloored} energy`);
  // Use callback form - add delta, don't set absolute value!
  onEnergyChangeRef.current((prevEnergy: number) => {
    const newEnergy = Math.min(maxEnergyRef.current, prevEnergy + energyToAddFloored);
    console.log(`🔋 Energy regen result: ${prevEnergy} + ${energyToAddFloored} = ${newEnergy}`);
    return newEnergy;
  });
}
```

**Key Changes:**
- ✅ Changed from absolute value to **callback form**: `setEnergy(prev => prev + delta)`
- ✅ Always uses **current energy value** from React state, not cached ref
- ✅ Only regenerates when we have at least **1 full energy point** to add
- ✅ Added clear logging to track regeneration attempts and results

---

### Bug #2: Realtime Subscription Overwriting Local Energy

**File:** `src/hooks/useGameState.ts:828-887` (Realtime subscription)

**Problem:**
```typescript
// ❌ OLD CODE - Loading energy from database update
setState(prev => {
  // ...
  energy: Math.min(updatedProfile.energy, calculatedMaxEnergy), // Overwrites local!
  // ...
});
```

**What Happened:**
1. Player moves quickly: 98 → 97 → 95 → ... → 71 ⚡
2. Autosave has **2-second debounce**, so it waits
3. Player continues moving (energy keeps dropping)
4. After 2 seconds, **old value** (e.g., 98) is saved to DB 💾
5. **Supabase Realtime** immediately sends update back
6. useGameState receives realtime update and sets: `energy = 98`
7. Energy jumps from 71 back to 98! 🔄❌

**Fix:**
```typescript
// ✅ NEW CODE - Ignoring energy from realtime updates
setState(prev => {
  // CRITICAL: Also preserve energy from prev state!
  // Energy changes locally (movement, regeneration) and should only save OUT to DB,
  // never load back IN from Realtime updates (causes energy jumps due to autosave debounce)

  console.log(`🔄 Realtime profile update - IGNORING energy from DB (${updatedProfile.energy}), keeping local (${prev.energy})`);

  return {
    ...prev,
    profile: updatedProfile,
    // KEEP current energy - do not overwrite from Realtime!
    energy: prev.energy,
    maxEnergy: calculatedMaxEnergy,
    // ... other fields from updatedProfile
  };
});
```

**Key Changes:**
- ✅ Realtime updates now **preserve local energy** value: `energy: prev.energy`
- ✅ Energy only flows **OUT to DB** (autosave), never **IN from DB** (realtime)
- ✅ Local state is **always correct** - it's the source of truth for energy
- ✅ Added logging to track when realtime updates are ignored

**Why This Works:**
- Energy changes **locally** (player movement, energy regeneration)
- Energy should be **saved to DB** for persistence
- Energy should **NEVER be loaded from DB** during active gameplay
- Realtime updates are for changes from **other sources** (admin panel, etc.)
- During normal gameplay, **local state is always correct**

---

## Additional Improvements

### Simplified setEnergy Logging

**File:** `src/hooks/useGameState.ts:1011`

**Before:**
```typescript
const energyDiff = clampedEnergy - prev.energy;
const stackTrace = energyDiff > 5 ? new Error().stack : undefined;
console.log(`⚡ setEnergy: ${prev.energy} → ${clampedEnergy} (requested: ${newEnergy}, max: ${prev.maxEnergy})${energyDiff > 5 ? ' ⚠️ BIG JUMP!' : ''}`);
if (stackTrace) {
  console.log('📍 Stack trace for energy jump:', stackTrace);
}
```

**After:**
```typescript
console.log(`⚡ setEnergy: ${prev.energy} → ${clampedEnergy} (max: ${prev.maxEnergy})`);
```

**Rationale:**
- Stack trace logging was used for debugging during development
- Now that root causes are identified and fixed, it's no longer needed
- Simplified log is cleaner and easier to read
- Still provides essential information (old value → new value, max energy)

---

## Files Modified

### 1. `src/hooks/useEnergyRegeneration.ts`
**Changes:**
- Changed energy regeneration to use callback form: `setEnergy(prev => prev + delta)`
- Only regenerate when we have at least 1 full energy point to add
- Added logging for regeneration attempts and results
- Updated `@lastModified` to 2025-11-17

**Lines Changed:** 85-98

### 2. `src/hooks/useGameState.ts`
**Changes:**
- Realtime subscription now ignores energy from DB updates
- Preserves local energy value during realtime updates: `energy: prev.energy`
- Simplified setEnergy logging (removed stack trace)
- Updated file header with new features
- Updated `@lastModified` to 2025-11-17

**Lines Changed:**
- 1-16 (file header)
- 857 (realtime update logging)
- 863 (energy preservation)
- 1011 (simplified logging)

---

## Testing

### Test Scenario 1: Rapid Movement
✅ **Expected:** Energy decreases smoothly without jumping back up
✅ **Result:** PASS - Energy decreases correctly, no refills observed

### Test Scenario 2: Movement with Autosave Delay
✅ **Expected:** Energy continues to decrease during 2-second autosave window
✅ **Result:** PASS - Realtime updates ignore energy, local value preserved

### Test Scenario 3: Energy Regeneration
✅ **Expected:** Energy increases by 1 point every ~6 minutes (10/hour)
✅ **Result:** PASS - Regeneration uses callback form, adds to current value

### Test Scenario 4: Long Play Session
✅ **Expected:** No energy jumps over extended gameplay
✅ **Result:** PASS - Confirmed by user testing

---

## Code Patterns Used

### Pattern #1: Callback Form for State Updates

**From:** `coding_rules.md` - Section 15.17 React State Closure Pattern

```typescript
// ✅ Use callback form to avoid stale closures
setState(prev => {
  const newValue = prev.value + delta;
  return { ...prev, value: newValue };
});

// ❌ Never use direct value (can be stale)
setState({ value: currentValue + delta });
```

**Applied in:**
- Energy regeneration callback
- Movement energy deduction (previous fix)

### Pattern #2: Preserving Local State in Realtime Updates

**New Pattern** - Added to coding_rules.md

```typescript
// ✅ Preserve local state for values that change frequently
setState(prev => {
  console.log(`🔄 Realtime update - IGNORING field from DB, keeping local`);
  return {
    ...prev,
    profile: updatedProfile,
    localValue: prev.localValue, // KEEP local value
    // ... other fields from updatedProfile
  };
});
```

**Rationale:**
- Local state changes happen **faster** than DB save/load cycle
- Realtime updates should only affect **infrequent changes**
- Frequent changes (energy, position) should be **write-only** to DB

---

## Lessons Learned

### 1. Callback Form is Required for High-Frequency Updates
- Energy changes multiple times per second during movement
- Callback form ensures we always use the **latest value**
- Direct value form captures **stale closures**

### 2. Realtime Subscriptions Need Careful Filtering
- Not all DB updates should overwrite local state
- High-frequency values (energy, position) should be **write-only**
- Low-frequency values (gold, level, inventory) can be **read-write**

### 3. Autosave Debouncing Creates Race Conditions
- 2-second debounce means DB can be "behind" local state
- Realtime updates during this window contain **stale data**
- Solution: Ignore high-frequency fields in realtime updates

### 4. Debug Logging is Critical for Async Bugs
- Console logs with emoji prefixes made debugging possible
- Logs showed the **sequence** of events (movement → regen → realtime)
- Without logs, this bug would be nearly impossible to track

---

## Related Documentation

- [coding_rules.md](coding_rules.md) - Section 15.17: React State Closure Pattern
- [STATE_MANAGEMENT_FIX.md](STATE_MANAGEMENT_FIX.md) - Related state management fixes
- [REACT_STATE_CLOSURE_FIX.md](REACT_STATE_CLOSURE_FIX.md) - Detailed closure fix explanation

---

## Migration Notes

### For Developers

If you're adding new high-frequency state values (similar to energy), follow this pattern:

1. **Use callback form for all updates:**
   ```typescript
   setHighFreqValue(prev => prev + delta);
   ```

2. **Preserve local value in realtime updates:**
   ```typescript
   setState(prev => ({
     ...prev,
     highFreqValue: prev.highFreqValue, // KEEP local
     // ... other fields from DB
   }));
   ```

3. **Add clear logging:**
   ```typescript
   console.log(`🔄 Realtime update - IGNORING highFreqValue from DB (${dbValue}), keeping local (${localValue})`);
   ```

### For New Features

If you're implementing similar systems (stamina, mana, etc.):
- ✅ Use this same pattern from the start
- ✅ Test rapid updates thoroughly
- ✅ Monitor logs for unexpected jumps
- ✅ Document behavior in code comments

---

## Conclusion

This bug was caused by **two independent issues**:
1. Energy regeneration using stale cached values
2. Realtime subscription overwriting local energy with DB values

Both issues are now **completely fixed** by:
1. Using **callback form** for all energy updates
2. **Ignoring energy** from realtime DB updates

The fixes follow established React patterns and coding standards from `coding_rules.md`.

**Status:** ✅ **RESOLVED** - Confirmed working by user testing.

---

**Last Updated:** 2025-11-17
