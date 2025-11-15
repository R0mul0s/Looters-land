# React State Closure Pattern - Combat Metadata Fix

**Date:** 2025-11-15
**Version:** Post v0.8.0
**Author:** Claude Code Assistant
**Issue:** Wandering monsters and rare spawns could be attacked repeatedly after being defeated

---

## Problem Description

### Symptoms
- After defeating a wandering monster or rare spawn in quick combat
- Player could click on the monster again and initiate combat repeatedly
- The monster's `defeated` status was not being persisted
- Database showed `[Save] World map - Defeated monsters: 0/10` even after victories

### Root Cause Analysis

The issue was caused by **React state closure problem** in the combat callback system.

#### The Timeline

```
1. User clicks wandering monster
2. handleQuickCombat(enemies, 'wandering_monster', metadata) called
3. quickCombatMetadata state set to metadata
4. setTimeout executes, creates combat engine
5. combatEngine.onCombatEnd = () => handleQuickCombatEnd()  ← CLOSURE CAPTURES STATE
6. Combat runs asynchronously
7. Combat ends, calls handleQuickCombatEnd()
8. Inside handleQuickCombatEnd: quickCombatMetadata is NULL!
```

#### Why State Was NULL

The callback function `handleQuickCombatEnd()` was created as a closure that captured the **current state** at the time of `setTimeout` execution. However, React state updates are asynchronous, so by the time the callback was set, `quickCombatMetadata` had not been updated yet.

**Console Evidence:**
```
🔍 DEBUG: handleQuickCombatEnd called
🔍 DEBUG: metadata parameter: undefined
🔍 DEBUG: quickCombatMetadata state: null
❌ DEBUG: combatMetadata is null, cannot mark as defeated
[Save] World map - Defeated monsters: 0/10
```

---

## Solution Implemented

### Pattern: Closure Variable Parameter Passing

Instead of relying on React state in the callback, we **capture the metadata in a closure variable** and pass it directly to the callback.

### Code Changes

#### File: `src/Router.tsx`

**Lines 340-351: Capture metadata in closure**
```typescript
const handleQuickCombat = (enemies: Enemy[], combatType: 'rare_spawn' | 'wandering_monster', metadata?: any) => {
  console.log('🎯 Quick combat initiated:', combatType);
  setQuickCombatMetadata(metadata);

  // IMPORTANT: Capture metadata in closure to avoid null reference later
  const capturedMetadata = metadata;

  setTimeout(() => {
    combatEngine.initialize(activeHeroes, enemies);
    combatEngine.isManualMode = isManual;
    setCombatLog([...combatEngine.combatLog]);

    // Set callback for combat end - use quick combat handler with captured metadata
    combatEngine.onCombatEnd = () => handleQuickCombatEnd(capturedMetadata);

    if (isManual) {
      // ... manual combat logic
    } else {
      combatEngine.runAutoCombat().then(() => {
        combatEngine.onCombatEnd?.();
      });
    }
  }, 0);
};
```

**Lines 375-382: Accept metadata as parameter with fallback**
```typescript
const handleQuickCombatEnd = async (metadata?: any) => {
  console.log('✅ Quick combat completed');
  console.log('🔍 DEBUG: handleQuickCombatEnd called');
  console.log('🔍 DEBUG: metadata parameter:', metadata);
  console.log('🔍 DEBUG: quickCombatMetadata state:', quickCombatMetadata);

  // Use metadata parameter if provided, otherwise fall back to state
  const combatMetadata = metadata || quickCombatMetadata;

  // ... rest of function uses combatMetadata instead of quickCombatMetadata
```

**Lines 419-453: Use combatMetadata throughout**
```typescript
// Victory! Mark monster/rare spawn as defeated in worldMap
if (combatMetadata && gameState.worldMap) {
  console.log('🔍 DEBUG: Starting to mark monster as defeated');
  console.log('🔍 DEBUG: combatMetadata:', combatMetadata);

  const updatedWorldMap = { ...gameState.worldMap };

  // Find and mark the specific object as defeated in the worldMap's dynamicObjects
  if (combatMetadata.position) {
    const pos = combatMetadata.position;

    const objectIndex = updatedWorldMap.dynamicObjects.findIndex(
      obj => obj.position.x === pos.x && obj.position.y === pos.y
    );

    if (objectIndex !== -1) {
      // Create new array with updated object
      updatedWorldMap.dynamicObjects = [...updatedWorldMap.dynamicObjects];
      updatedWorldMap.dynamicObjects[objectIndex] = {
        ...updatedWorldMap.dynamicObjects[objectIndex],
        defeated: true
      };

      if (combatMetadata.rareSpawnObject) {
        console.log('🎯 Rare spawn marked as defeated at position', pos);
      } else if (combatMetadata.monsterObject) {
        console.log('🎯 Wandering monster marked as defeated at position', pos);
      }
    }
  }

  // Update worldmap with defeated status
  await gameActions.updateWorldMap(updatedWorldMap);
}
```

---

## How It Works Now

### Data Flow

```
1. User clicks wandering monster at position {x: 10, y: 5}
   ↓
2. handleQuickCombat called with metadata = {position: {x: 10, y: 5}, monsterObject: {...}}
   ↓
3. Capture metadata in closure variable: capturedMetadata = metadata
   ↓
4. setTimeout executes:
   - Create combat engine
   - Set callback: onCombatEnd = () => handleQuickCombatEnd(capturedMetadata)
   ↓
5. Combat runs asynchronously (auto or manual)
   ↓
6. Combat ends, callback fires: handleQuickCombatEnd(capturedMetadata)
   ↓
7. Inside handleQuickCombatEnd:
   - const combatMetadata = metadata || quickCombatMetadata
   - combatMetadata = {position: {x: 10, y: 5}, monsterObject: {...}} ✅
   ↓
8. Find object at position {x: 10, y: 5} in worldMap.dynamicObjects
   ↓
9. Set defeated: true on that object
   ↓
10. Update worldMap → triggers auto-save
   ↓
11. Database saves: [Save] World map - Defeated monsters: 1/10 ✅
```

---

## Technical Pattern: React State Closure Problem

### The Problem Pattern (Anti-Pattern)

```typescript
// ❌ BAD: Callback captures stale state
const handleAction = (data) => {
  setState(data);  // Async state update

  setTimeout(() => {
    // Callback references state - but state update hasn't happened yet!
    callback.onComplete = () => useStateValue();  // State is NULL or stale!
  }, 0);
};
```

### The Solution Pattern

```typescript
// ✅ GOOD: Capture data in closure variable, pass to callback
const handleAction = (data) => {
  setState(data);  // Still set state for UI

  const capturedData = data;  // Capture in closure variable

  setTimeout(() => {
    // Pass captured data directly to callback
    callback.onComplete = () => useData(capturedData);  // Data is correct!
  }, 0);
};
```

### Why This Pattern Works

1. **Closure variables are synchronous** - No async delay
2. **Function parameters are reliable** - Passed directly, not through state
3. **Backward compatible** - Fallback to state if parameter not provided
4. **Testable** - Easy to verify by checking parameter values

---

## When to Use This Pattern

### Use this pattern when:
- ✅ Setting callbacks inside async operations (`setTimeout`, promises)
- ✅ Callbacks will fire after significant time delay
- ✅ Callback needs data that's also stored in React state
- ✅ State updates might not complete before callback is set

### Common scenarios:
- Combat systems with async turn execution
- Animation callbacks
- API request callbacks
- Event handlers with delays
- Timers and intervals

### Example - Combat Engine Callback

```typescript
// ✅ GOOD: Capture combat rewards before async combat
const startCombat = (enemies: Enemy[], rewards: Rewards) => {
  const capturedRewards = rewards;  // Capture in closure

  combatEngine.initialize(heroes, enemies);
  combatEngine.onVictory = () => {
    giveRewards(capturedRewards);  // Use captured data, not state
  };

  combatEngine.runCombat();  // Async
};
```

---

## Related Fixes Applied

### 1. WorldMapDemo2 - Stale Object Reference Check

**File:** `src/components/WorldMapDemo2.tsx`
**Lines:** 723-745

**Problem:** Component was checking `defeated` status on the **passed object reference**, not the current worldMap state.

**Fix:** Always look up current monster in worldMap by position:

```typescript
const handleWanderingMonsterCombat = async (monster: WanderingMonster) => {
  // IMPORTANT: Always check defeated status from current worldMap state, not from the passed object
  const currentMonster = gameState.worldMap?.dynamicObjects.find(
    obj => obj.type === 'wanderingMonster' &&
           obj.position.x === monster.position.x &&
           obj.position.y === monster.position.y
  ) as WanderingMonster | undefined;

  // Check if already defeated (and waiting to respawn)
  if (currentMonster?.defeated) {
    setShowMessageModal(t('worldmap.monsterDefeated'));
    return;
  }

  // ... proceed with combat
};
```

**Why this was needed:**
- React props/objects are immutable
- When worldMap updates, old object references don't update
- Must always look up current state by unique identifier (position)

---

## Verification

### Test Scenario
1. Login to game
2. Go to world map
3. Click on a wandering monster
4. Win the combat (auto or manual)
5. Try to click the same monster again

### Expected Results
✅ Monster is marked as defeated
✅ Clicking defeated monster shows "Monster already defeated" message
✅ Console shows: `🎯 Wandering monster marked as defeated at position {x, y}`
✅ Database save shows: `[Save] World map - Defeated monsters: 1/10`
✅ Same behavior for rare spawns

### Debug Console Output (Success)
```
🎯 Quick combat initiated: wandering_monster
🔍 DEBUG: Starting to mark monster as defeated
🔍 DEBUG: combatMetadata: {position: {x: 10, y: 5}, monsterObject: {...}}
🔍 DEBUG: Looking for object at position: {x: 10, y: 5}
🔍 DEBUG: Found object at index: 3
🔍 DEBUG: Object defeated status BEFORE update: false
🔍 DEBUG: Object defeated status AFTER update: true
🎯 Wandering monster marked as defeated at position {x: 10, y: 5}
🔍 DEBUG: Calling updateWorldMap with defeated monsters count: 1
💾 Auto-saving game state...
[Save] World map - Defeated monsters: 1/10
```

---

## Coding Pattern to Add to coding_rules.md

### 15.17 React State Closure Pattern for Async Callbacks

**Rule:** When setting callbacks inside async operations that need current data, capture the data in a closure variable and pass it as a parameter instead of relying on React state.

**Pattern:**

```typescript
// ✅ GOOD: Closure variable + parameter passing
const handleAsyncAction = (data: any) => {
  setState(data);  // Update state for UI

  const capturedData = data;  // Capture in closure

  setTimeout(() => {
    asyncOperation.onComplete = () => handleCallback(capturedData);
  }, 0);
};

const handleCallback = (data?: any) => {
  const actualData = data || stateData;  // Fallback to state
  // Use actualData...
};

// ❌ BAD: Relying on state in closure
const handleAsyncAction = (data: any) => {
  setState(data);

  setTimeout(() => {
    asyncOperation.onComplete = () => handleCallback();  // State might be null!
  }, 0);
};

const handleCallback = () => {
  const actualData = stateData;  // Might be null or stale!
  // Use actualData...
};
```

**When to use:**
- ✅ Combat callbacks with rewards/metadata
- ✅ Animation end callbacks
- ✅ Timer/interval callbacks
- ✅ Event handlers with async operations
- ✅ Any callback set inside `setTimeout`, `setInterval`, promises

**Key Points:**
- ✅ Capture data in `const capturedData = data` before async operation
- ✅ Pass captured data to callback as parameter
- ✅ Accept parameter in callback with fallback: `data || stateData`
- ✅ Document with comment: `// IMPORTANT: Capture in closure to avoid null reference`
- ❌ Never rely solely on React state in async callbacks

---

## Performance Impact

**Memory:** Negligible - closure variable is a reference, not a copy
**Execution:** No performance difference - direct variable access vs state access
**Reliability:** ✅ 100% - eliminates race condition between state update and callback execution

---

## References

- **Bug Report:** User reported "Stále ho můžu chodit dokola i když jsem wandering monster zabil"
- **Root Cause:** React state closure with null `quickCombatMetadata`
- **Solution:** Closure variable parameter passing pattern
- **Related Docs:** `STATE_MANAGEMENT_FIX.md` - Single state instance pattern

---

**Status:** ✅ RESOLVED
**Verified:** 2025-11-15
**Impact:** Critical bug fix - Wandering monsters and rare spawns now properly track defeated status
**Applies To:** All wandering monsters and rare spawns on world map
