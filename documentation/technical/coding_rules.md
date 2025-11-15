# Coding Rules - Looters Land

**Author:** Roman Hlaváček - rhsoft.cz
**Copyright:** 2025
**Last Modified:** 2025-11-07

---

## Overview

This document defines the coding standards and best practices for the Looters Land project. All code must follow these rules to ensure consistency, maintainability, and quality across the entire codebase.

---

## 1. Function Documentation

### Rule
Every function must have JSDoc documentation in English that includes:
- **Description**: What the function does
- **Parameters**: All parameters with types and descriptions
- **Returns**: Return type and description
- **Example**: Usage example

### Example

```typescript
/**
 * Calculate total damage with critical hit modifier
 *
 * Computes the final damage value after applying defense reduction
 * and critical hit multiplier if applicable.
 *
 * @param baseDamage - Base damage value before modifiers
 * @param defense - Target's defense stat
 * @param isCrit - Whether the attack is a critical hit
 * @returns Final damage value after all calculations
 *
 * @example
 * ```typescript
 * const damage = calculateDamage(100, 50, true);
 * console.log(damage); // 150 (with crit modifier)
 * ```
 */
function calculateDamage(baseDamage: number, defense: number, isCrit: boolean): number {
  const damageReduction = 100 / (100 + defense);
  let finalDamage = Math.floor(baseDamage * damageReduction);

  if (isCrit) {
    finalDamage = Math.floor(finalDamage * 1.5);
  }

  return finalDamage;
}
```

---

## 2. Localization

### Rule
All game text must be stored in localization files (`src/localization/locales/`). Never hardcode user-facing strings in components or game logic.

### Process
1. Add the text key to `src/localization/locales/en.ts`
2. Add the translation to `src/localization/locales/cs.ts`
3. Use the `t()` function to retrieve the translated text

### Example

```typescript
// ❌ BAD - Hardcoded text
<button>Start Combat</button>

// ✅ GOOD - Using localization
import { t } from '../localization/i18n';

<button>{t('combat.startCombat')}</button>
```

### Adding New Text
When adding new user-facing text:

```typescript
// 1. Add to en.ts
export const en = {
  // ...
  newFeature: {
    title: 'New Feature Title',
    description: 'Description of the new feature',
  },
};

// 2. Add to cs.ts
export const cs: LocaleKeys = {
  // ...
  newFeature: {
    title: 'Název Nové Funkce',
    description: 'Popis nové funkce',
  },
};

// 3. Use in code
const title = t('newFeature.title');
```

---

## 3. File Headers

### Rule
Every source file must include a header comment with:
- **Description**: Purpose of the file and what it contains
- **Author**: Roman Hlaváček - rhsoft.cz
- **Copyright**: 2025
- **Last Modified**: Date in format YYYY-MM-DD

### Example

```typescript
/**
 * Combat Engine - Core turn-based combat system
 *
 * Manages combat flow, turn order, initiative, victory conditions,
 * and coordination between heroes and enemies. Supports both
 * automatic and manual combat modes.
 *
 * Contains:
 * - CombatEngine class - Main combat controller
 * - Turn order calculation based on initiative
 * - Combat action execution and logging
 * - Victory/defeat condition checking
 * - Manual and auto combat mode switching
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-01-07
 */

import type { Hero } from '../hero/Hero';
// ... rest of the file
```

### Update Rule
**IMPORTANT**: When modifying any file, update the `@lastModified` date and the "Contains:" section if the file's purpose has changed.

---

## 4. TypeScript Standards

### Type Safety
- ✅ Use explicit types for all function parameters and return values
- ✅ Use interfaces or types for complex objects
- ❌ Never use `any` type (use `unknown` if type is truly unknown)
- ✅ Enable strict mode in `tsconfig.json`

### Example

```typescript
// ❌ BAD
function processData(data: any): any {
  return data.value;
}

// ✅ GOOD
interface GameData {
  value: number;
  name: string;
}

function processData(data: GameData): number {
  return data.value;
}
```

---

## 5. Code Organization

### File Structure
```
src/
├── engine/              # Game logic (no UI)
│   ├── hero/
│   ├── combat/
│   ├── item/
│   └── equipment/
├── components/          # React UI components
├── localization/        # Translation files
│   ├── locales/
│   │   ├── en.ts
│   │   └── cs.ts
│   └── i18n.ts
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── utils/              # Utility functions
```

### Separation of Concerns
- **Engine**: Pure TypeScript, no React, no DOM
- **Components**: React UI, uses engine via props/state
- **Types**: Shared type definitions
- **Localization**: All translatable strings

---

## 6. Naming Conventions

### Files
- **Components**: PascalCase (e.g., `HeroCard.tsx`)
- **Utilities**: camelCase (e.g., `calculateStats.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `hero.types.ts`)

### Variables & Functions
- **Variables**: camelCase (e.g., `heroName`, `currentHP`)
- **Functions**: camelCase (e.g., `calculateDamage`, `rollInitiative`)
- **Classes**: PascalCase (e.g., `Hero`, `CombatEngine`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_LEVEL`, `BASE_CRIT_CHANCE`)

### Boolean Variables
Prefix with `is`, `has`, `should`, or `can`:
```typescript
isAlive: boolean;
hasEquipment: boolean;
shouldShowTooltip: boolean;
canUseSkill: boolean;
```

---

## 7. React Component Standards

### Component Structure
```typescript
/**
 * Hero Card Component
 *
 * Displays hero information including stats, HP bar, and equipment.
 * Used in combat screen and hero management.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-01-07
 */

import { t } from '../localization/i18n';
import type { Hero } from '../engine/hero/Hero';

interface HeroCardProps {
  hero: Hero;
  onSelect?: (hero: Hero) => void;
}

/**
 * Renders a card displaying hero information
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <HeroCard hero={warrior} onSelect={handleHeroSelect} />
 * ```
 */
export function HeroCard({ hero, onSelect }: HeroCardProps) {
  return (
    <div className="hero-card">
      <h3>{hero.name}</h3>
      <p>{t('stats.hp')}: {hero.currentHP}/{hero.maxHP}</p>
    </div>
  );
}
```

---

## 8. Git Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `test`: Adding tests
- `chore`: Maintenance tasks

### Example
```
feat(combat): Add status effects system

Implemented buff/debuff mechanics with duration tracking.
Skills now apply actual stat modifiers that persist for
multiple turns.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 9. Error Handling

### Rules
- Always handle potential errors
- Use try-catch for operations that might fail
- Log errors with context information
- Provide user-friendly error messages from localization

### Example

```typescript
/**
 * Load game state from storage
 *
 * @returns Saved game state or null if loading fails
 *
 * @example
 * ```typescript
 * const state = await loadGameState();
 * if (state) {
 *   // Restore game
 * }
 * ```
 */
async function loadGameState(): Promise<GameState | null> {
  try {
    const data = await fetchFromDatabase();
    return parseGameState(data);
  } catch (error) {
    console.error('Failed to load game state:', error);
    alert(t('errors.generic'));
    return null;
  }
}
```

---

## 10. Performance Guidelines

### React Optimization
- Use `React.memo()` for expensive components
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for event handlers passed to children
- Avoid creating functions inside render

### Example

```typescript
import { memo, useMemo, useCallback } from 'react';

export const HeroList = memo(({ heroes, onSelect }: HeroListProps) => {
  // Memoize expensive calculation
  const sortedHeroes = useMemo(() => {
    return [...heroes].sort((a, b) => b.level - a.level);
  }, [heroes]);

  // Memoize callback
  const handleSelect = useCallback((hero: Hero) => {
    onSelect(hero);
  }, [onSelect]);

  return (
    <div>
      {sortedHeroes.map(hero => (
        <HeroCard key={hero.id} hero={hero} onSelect={handleSelect} />
      ))}
    </div>
  );
});
```

---

## 11. Testing Standards

### Unit Tests
- Test all game logic functions
- Test edge cases and error conditions
- Use descriptive test names

### Example

```typescript
describe('calculateDamage', () => {
  it('should calculate basic damage with defense reduction', () => {
    const damage = calculateDamage(100, 50, false);
    expect(damage).toBe(67);
  });

  it('should apply critical hit modifier', () => {
    const damage = calculateDamage(100, 50, true);
    expect(damage).toBe(100);
  });

  it('should handle zero defense', () => {
    const damage = calculateDamage(100, 0, false);
    expect(damage).toBe(100);
  });
});
```

---

## 12. Code Review Checklist

Before submitting code, verify:

- [ ] All functions have JSDoc documentation with examples
- [ ] All user-facing text uses localization (`t()` function)
- [ ] File header is present with correct date
- [ ] TypeScript types are explicit (no `any`)
- [ ] Code follows naming conventions
- [ ] Error handling is implemented
- [ ] No console.log() in production code (use proper logging)
- [ ] Components are optimized (memo, useMemo, useCallback where needed)
- [ ] Tests are written for new logic
- [ ] Commit message follows format

---

## 13. Common Patterns

### Singleton Pattern (Game Systems)
```typescript
/**
 * Game Manager - Singleton controller for game state
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-01-07
 */

export class GameManager {
  private static instance: GameManager;

  private constructor() {
    // Private constructor
  }

  /**
   * Get the singleton instance
   *
   * @returns GameManager instance
   *
   * @example
   * ```typescript
   * const game = GameManager.getInstance();
   * game.startCombat();
   * ```
   */
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }
}
```

---

## 14. Core Implementation Patterns

This section contains proven implementation patterns used in Looters Land. **Always use these patterns** for consistency and maintainability.

### 14.1 Save/Load System Pattern

#### LocalStorage Auto-Save (Offline Persistence)

**Purpose:** Automatically save game state to browser localStorage for quick recovery on page refresh.

**When to use:** For any game state that should persist between sessions (inventory, heroes, progress).

**Implementation:**

```typescript
// services/LocalStorageService.ts
const STORAGE_KEY = 'game-autosave';
const VERSION = '1.0.0';

/**
 * Save game state to localStorage
 *
 * @param data - Game state to save
 *
 * @example
 * ```typescript
 * saveToLocalStorage(heroes, inventory, gold);
 * ```
 */
export function saveToLocalStorage(data: GameState): void {
  try {
    const state = {
      version: VERSION,
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('✅ Auto-saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save:', error);
  }
}

/**
 * Load game state from localStorage
 *
 * @returns Saved state or null
 *
 * @example
 * ```typescript
 * const saved = loadFromLocalStorage();
 * if (saved) restoreGame(saved);
 * ```
 */
export function loadFromLocalStorage(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved);
    if (state.version !== VERSION) {
      console.warn('⚠️ Version mismatch');
    }
    return state.data;
  } catch (error) {
    console.error('❌ Failed to load:', error);
    return null;
  }
}
```

#### React Integration Pattern

```typescript
// App.tsx
import { loadFromLocalStorage, saveToLocalStorage } from './services/LocalStorageService';

function App() {
  // Auto-restore on startup
  const [heroes] = useState<Hero[]>(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      console.log('🔄 Restoring from auto-save...');
      return restoreGameState(saved).heroes;
    }
    console.log('🆕 Creating new game...');
    return createNewHeroes();
  });

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToLocalStorage(heroes, inventory, gold);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [heroes, inventory, gold]);
}
```

**Key Points:**
- ✅ Auto-save with 1 second debounce to avoid excessive writes
- ✅ Auto-restore on app startup
- ✅ Version checking for save compatibility
- ✅ Error handling with fallbacks
- ✅ Console logging for debugging

---

### 14.2 Cloud Save Pattern (Supabase)

**Purpose:** Manual save to cloud database for cross-device sync and permanent storage.

**When to use:** When user explicitly clicks "Save Game" or "Load Game".

**Implementation:**

```typescript
// services/GameSaveService.ts
export class GameSaveService {
  /**
   * Save game to cloud
   *
   * @param userId - User ID from auth
   * @param gameState - Complete game state
   *
   * @example
   * ```typescript
   * await GameSaveService.saveGame(userId, { heroes, inventory });
   * ```
   */
  static async saveGame(userId: string, gameState: any): Promise<void> {
    const { error } = await supabase
      .from('saves')
      .upsert({
        user_id: userId,
        save_data: gameState,
        updated_at: new Date()
      });

    if (error) throw error;
  }
}
```

**Usage in App:**
```typescript
const handleSaveToCloud = async () => {
  try {
    await GameSaveService.saveGame(userId, { heroes, inventory, gold });
    alert('☁️ Saved to cloud!');
  } catch (error) {
    alert('❌ Cloud save failed');
  }
};
```

---

### 14.3 State Restoration Pattern

**Purpose:** Reconstruct game objects from serialized data.

**Implementation:**

```typescript
// services/GameStateRestorer.ts

/**
 * Restore hero from saved data
 *
 * @param savedHero - Serialized hero data
 * @param allItems - All items for equipment references
 * @returns Restored Hero instance
 */
export function restoreHero(savedHero: any, allItems: Item[]): Hero {
  // Create instance
  const hero = new Hero(savedHero.name, savedHero.class, savedHero.level);

  // Restore state
  hero.currentHP = savedHero.currentHP;
  hero.equipment = new Equipment(hero);

  // Restore equipped items
  savedHero.equippedItems.forEach((equipped: any) => {
    const item = allItems.find(i => i.id === equipped.itemId);
    if (item) {
      hero.equipment.slots[equipped.slot] = item;
    }
  });

  // Recalculate stats
  hero.equipment.recalculateStats();
  hero.updateStatsWithEquipment();

  return hero;
}

/**
 * Restore complete game state
 *
 * @param savedState - Complete saved state
 * @returns Restored game objects
 */
export function restoreGameState(savedState: any) {
  const inventory = savedState.inventory.map(restoreItem);
  const heroes = savedState.heroes.map(h => restoreHero(h, inventory));

  return { heroes, inventory, gold: savedState.gold };
}
```

**Key Points:**
- ✅ Always restore items before heroes (for equipment references)
- ✅ Recalculate derived values after restoration
- ✅ Handle missing/invalid data gracefully

---

### 14.4 Item Constructor Pattern

**Purpose:** Unified item creation with configuration object.

**Always use this pattern:**

```typescript
// ❌ BAD - Multiple parameters
const item = new Item(name, type, slot, icon, level, rarity, stats);

// ✅ GOOD - Config object
const item = new Item({
  id: 'item_123',
  name: 'Iron Sword',
  type: 'equipment',
  slot: 'weapon',
  icon: '⚔️',
  level: 5,
  rarity: 'rare',
  stats: { ATK: 50, DEF: 10 },
  goldValue: 100,
  enchantLevel: 0,
  setId: null,
  setName: null,
  description: 'A sturdy iron sword'
});
```

**Benefits:**
- ✅ Self-documenting code
- ✅ Easy to add new properties
- ✅ Optional parameters with defaults
- ✅ No parameter order confusion

---

### 14.5 TypeScript Type Safety Patterns

#### Localization Types

**Pattern for allowing translations while maintaining structure:**

```typescript
// locales/en.ts
export const en = {
  app: { title: 'Game Name' },
  combat: { victory: 'Victory!' }
} as const;

// Extract structure type (not literal values)
type LocaleStructure<T> = T extends object
  ? { [P in keyof T]: T[P] extends string ? string : LocaleStructure<T[P]> }
  : T;

export type LocaleKeys = LocaleStructure<typeof en>;
```

**This allows:**
```typescript
// cs.ts can have different strings
const cs: LocaleKeys = {
  app: { title: 'Název Hry' }, // ✅ Different Czech text
  combat: { victory: 'Vítězství!' } // ✅ Works!
};
```

#### Array Typing

**Always provide explicit types for arrays in complex operations:**

```typescript
// ❌ BAD - Implicit any[]
const results = [];
targets.forEach(t => results.push({ target: t, damage: 50 }));

// ✅ GOOD - Explicit type
const results: Array<{ target: Combatant; damage: number }> = [];
targets.forEach(t => results.push({ target: t, damage: 50 }));
```

#### Unused Parameters

**Use underscore prefix for required but unused parameters:**

```typescript
// ❌ BAD - TypeScript warning
function skill(caster: Hero, targets: Hero[]) {
  return caster.ATK * 2; // targets unused
}

// ✅ GOOD - Underscore prefix
function skill(caster: Hero, _targets: Hero[]) {
  return caster.ATK * 2; // No warning
}
```

---

### 14.6 React Optimization Patterns

#### Debounced Effects

**Use for expensive operations (saving, API calls):**

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    expensiveOperation();
  }, 1000); // Wait 1 second after last change

  return () => clearTimeout(timeoutId);
}, [dependencies]);
```

#### Initialization with Restoration

**Pattern for state with auto-restore:**

```typescript
const [state] = useState(() => {
  // Try restore first
  const saved = loadSavedState();
  if (saved) {
    console.log('🔄 Restoring...');
    return restoreState(saved);
  }

  // Fallback to new
  console.log('🆕 Creating new...');
  return createNewState();
});
```

---

### 14.7 Console Logging Standards

**Use emoji prefixes for log categorization:**

```typescript
console.log('✅ Success - Operation completed');
console.log('❌ Error - Operation failed');
console.log('⚠️ Warning - Potential issue');
console.log('ℹ️ Info - General information');
console.log('🔄 Loading - Data being loaded');
console.log('💾 Saving - Data being saved');
console.log('🆕 Creating - New instance created');
console.log('☁️ Cloud - Cloud operation');
```

---

### 14.8 Service Pattern Template

**Use this template for all new services:**

```typescript
/**
 * [Service Name] - Brief description
 *
 * Detailed description of what this service does and when to use it.
 *
 * Contains:
 * - Function 1 - Description
 * - Function 2 - Description
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified YYYY-MM-DD
 */

const CONFIG = {
  KEY: 'value',
  TIMEOUT: 1000
};

/**
 * Main function description
 *
 * @param param - Parameter description
 * @returns Return description
 *
 * @example
 * ```typescript
 * const result = mainFunction('value');
 * ```
 */
export function mainFunction(param: string): ReturnType {
  try {
    // Implementation
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}
```

---

## 15. Game-Specific Implementation Patterns

This section defines patterns specific to game development for Looters Land. These patterns ensure combat, progression, and equipment systems work consistently.

---

### 15.1 Game State Management

**Rule:** Keep game logic in engine classes, React components should only handle UI state and rendering.

```typescript
// ✅ GOOD: Clear separation between UI state and game logic state
const [combatEngine] = useState(() => new CombatEngine(heroes, enemies));
const [combatLog, setCombatLog] = useState<string[]>([]);
const [selectedTarget, setSelectedTarget] = useState<Enemy | null>(null);

// ❌ BAD: Mixing game logic calculations in UI components
const calculateDamage = () => {
  const baseDamage = hero.ATK * 2;
  const finalDamage = baseDamage - enemy.DEF;
  return Math.max(1, finalDamage);
};
```

**Key Points:**
- ✅ All combat calculations happen in `CombatEngine`
- ✅ All stat modifications happen in `Hero` or `Equipment` classes
- ✅ React components only trigger actions and display results
- ❌ Never calculate game values directly in JSX or event handlers

---

### 15.2 Game Loop and Timing Patterns

**Rule:** All game loops must be async with configurable delays to prevent UI blocking.

```typescript
// ✅ GOOD: Configurable delays with await
async runAutoCombat(delayMs: number = 800): Promise<void> {
  while (this.isActive && !this.waitingForPlayerInput) {
    this.executeTurn();
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

// ❌ BAD: Hardcoded timing or blocking synchronous loops
runAutoCombat(): void {
  while (this.isActive) {
    this.executeTurn(); // No delay, blocks UI
    // UI will freeze!
  }
}
```

**Key Points:**
- ✅ Always use `async/await` for turn-based loops
- ✅ Make delays configurable (500ms-1500ms typical)
- ✅ Check for stop conditions in loop (`isActive`, `waitingForPlayerInput`)
- ✅ Allow UI to update between turns

---

### 15.3 Status Effects and Buff/Debuff Stacking

**Rule:** Status effects with same name should replace, not stack (unless explicitly designed to stack).

```typescript
// ✅ GOOD: Replace existing effect, don't stack duration
addStatusEffect(effect: StatusEffect): void {
  const existing = this.statusEffects.find(e => e.name === effect.name);
  if (existing) {
    existing.duration = effect.duration; // Reset to new duration
    console.log(`🔄 ${effect.name} refreshed on ${this.name}`);
  } else {
    this.statusEffects.push(effect);
    console.log(`⭐ ${this.name} gained ${effect.name}`);
  }
}

// ❌ BAD: Allowing multiple instances of same effect
addStatusEffect(effect: StatusEffect): void {
  this.statusEffects.push(effect); // Can stack Battle Cry 10 times = broken!
}
```

**Key Points:**
- ✅ Find existing effect by name before adding
- ✅ Replace duration (don't add to it)
- ✅ Log both new effects and refreshed effects
- ❌ Never allow infinite stacking of buffs/debuffs

---

### 15.4 Combat Action Results

**Rule:** All combat actions must return `CombatActionResult` with actor, targets, damage, healing, and effects.

```typescript
// ✅ GOOD: Return complete action result with all relevant data
return {
  actor: caster,
  action: 'skill',
  skillName: this.name,
  targets: targets,
  damage: totalDamage,
  healing: totalHealing,
  effects: ['Applied Battle Cry to 3 heroes'],
  isCrit: false
};

// ❌ BAD: Incomplete or inconsistent action results
return {
  damage: totalDamage,
  message: 'Used skill' // Missing critical information!
};
```

**Key Points:**
- ✅ Always include `actor` (who performed the action)
- ✅ Always include `targets` (who was affected)
- ✅ Include `damage` and `healing` even if 0
- ✅ Include `effects` array describing what happened
- ✅ Use consistent structure for UI rendering

---

### 15.5 Stat Calculation Consistency

**Rule:** Always use `getCombatStats()` or `getEffectiveStat()` for calculations, never raw stat properties.

```typescript
// ✅ GOOD: Centralized stat calculation with all modifiers
getCombatStats(): HeroStats {
  return {
    maxHP: this.maxHP,
    ATK: this.getEffectiveStat(this.ATK, 'ATK'),
    DEF: this.getEffectiveStat(this.DEF, 'DEF'),
    SPD: this.getEffectiveStat(this.SPD, 'SPD'),
    CRIT: this.getEffectiveStat(this.CRIT, 'CRIT')
  };
}

getEffectiveStat(baseStat: number, statName: 'ATK' | 'DEF' | 'SPD' | 'CRIT'): number {
  let modifier = 0;
  for (const effect of this.statusEffects) {
    if (effect.stat === statName && effect.value) {
      modifier += effect.value;
    }
  }
  return Math.floor(baseStat * (1 + modifier / 100));
}

// ❌ BAD: Direct stat access ignoring modifiers
const damage = this.ATK * 2 - target.DEF; // Ignores buffs/debuffs!
```

**Key Points:**
- ✅ Always call `getCombatStats()` when calculating damage/healing
- ✅ Status effects automatically applied through `getEffectiveStat()`
- ✅ Equipment bonuses already included in base stats
- ❌ Never use `hero.ATK` directly in calculations

---

### 15.6 Save/Load Data Migration

**Rule:** All save data must include version number and have migration functions for older versions.

```typescript
// ✅ GOOD: Version checking and migration
const SAVE_VERSION = 3;

interface SaveData {
  version: number;
  heroes: any[];
  inventory: any[];
  gold: number;
}

function loadGame(data: SaveData): void {
  if (data.version < 2) {
    data = migrateV1toV2(data);
  }
  if (data.version < 3) {
    data = migrateV2toV3(data);
  }
  applyGameState(data);
}

function migrateV2toV3(data: SaveData): SaveData {
  // Add new fields introduced in v3
  data.heroes.forEach(hero => {
    if (!hero.statusEffects) {
      hero.statusEffects = [];
    }
  });
  data.version = 3;
  return data;
}

// ❌ BAD: No version tracking, breaks on structure changes
function loadGame(data: SaveData): void {
  this.heroes = data.heroes; // Fails if SaveData structure changed!
}
```

**Key Points:**
- ✅ Always include `version` field in save data
- ✅ Write migration function for each version bump
- ✅ Apply migrations sequentially (v1→v2→v3)
- ✅ Log migration steps for debugging
- ❌ Never assume save structure matches current code

---

### 15.7 Equipment Stat Application

**Rule:** Use recalculation functions, not manual stat adjustments, to prevent desync.

```typescript
// ✅ GOOD: Recalculate stats on equipment change
equipItem(slot: EquipmentSlot, item: Item): void {
  this.equipment[slot] = item;
  this.recalculateStats(); // Recalculates ATK, DEF, etc. from scratch
  console.log(`⚔️ Equipped ${item.name} in ${slot}`);
}

recalculateStats(): void {
  // Start from base stats
  let totalATK = this.baseATK;
  let totalDEF = this.baseDEF;

  // Add equipment bonuses
  Object.values(this.equipment).forEach(item => {
    if (item) {
      totalATK += item.stats.ATK || 0;
      totalDEF += item.stats.DEF || 0;
    }
  });

  // Apply final values
  this.ATK = totalATK;
  this.DEF = totalDEF;
}

// ❌ BAD: Manual stat adjustment (error-prone)
equipItem(slot: EquipmentSlot, item: Item): void {
  this.equipment[slot] = item;
  this.ATK += item.stats.ATK; // What if we're replacing an item?
  // Now stats are wrong!
}
```

**Key Points:**
- ✅ Always recalculate from base stats + equipment
- ✅ Never use `+=` or `-=` for equipment stats
- ✅ Store base stats separately from current stats
- ✅ Recalculate after: equip, unequip, level up, ascension

---

### 15.8 Skill Targeting Validation

**Rule:** Always validate skill targets and cooldown before execution, return null if invalid.

```typescript
// ✅ GOOD: Validate targets before skill execution
useSkill(skillIndex: number, targets: Combatant[]): CombatActionResult | null {
  const skill = this.skills[skillIndex];

  if (!skill) {
    console.error('❌ Skill not found at index', skillIndex);
    return null;
  }

  if (!skill.isReady()) {
    console.error('❌ Skill on cooldown');
    return null;
  }

  if (targets.length === 0) {
    console.error('❌ No valid targets for skill');
    return null;
  }

  const result = skill.activate(this, targets);
  return result;
}

// ❌ BAD: No validation, crashes on invalid targets
useSkill(skillIndex: number, targets: Combatant[]): CombatActionResult {
  const skill = this.skills[skillIndex];
  return skill.activate(this, targets); // Crashes if targets is empty!
}
```

**Key Points:**
- ✅ Check if skill exists at index
- ✅ Check if skill is off cooldown (`isReady()`)
- ✅ Check if targets array is not empty
- ✅ Return `null` for invalid usage (UI should handle)
- ✅ Log errors with emoji prefix (❌)

---

### 15.9 Turn Order and Initiative

**Rule:** Initiative must include randomness (SPD + random 0-10) and be logged for debugging.

```typescript
// ✅ GOOD: Clear turn order calculation with logging
calculateTurnOrder(): Combatant[] {
  const allCombatants = [...this.heroes, ...this.enemies]
    .filter(c => c.isAlive);

  const withInitiative = allCombatants.map(c => ({
    character: c,
    initiative: c.SPD + Math.floor(Math.random() * 11) // 0-10
  }));

  const sorted = withInitiative.sort((a, b) => b.initiative - a.initiative);

  console.log('📊 Turn Order:',
    sorted.map(o => `${o.character.name}(${o.initiative})`).join(', ')
  );

  return sorted.map(o => o.character);
}

// ❌ BAD: Unclear initiative or missing randomness
calculateTurnOrder(): Combatant[] {
  return [...this.heroes, ...this.enemies]
    .sort((a, b) => b.SPD - a.SPD); // Predictable = boring!
}
```

**Key Points:**
- ✅ Formula: `SPD + random(0-10)`
- ✅ Sort by initiative descending (highest goes first)
- ✅ Log full turn order with initiative values
- ✅ Recalculate at start of each round
- ❌ Never use pure SPD (too predictable)

---

### 15.10 Configuration Objects for Game Balance

**Rule:** All balance values must be in a config object, never hardcoded in game logic.

```typescript
// ✅ GOOD: Centralized balance configuration
export const BALANCE_CONFIG = {
  // Combat
  BASE_CRIT_CHANCE: 5,
  CRIT_DAMAGE_MULTIPLIER: 1.5,
  MIN_DAMAGE: 1,
  INITIATIVE_RANDOM_RANGE: 10,

  // Status Effects
  STATUS_EFFECT_MAX_DURATION: 5,
  STUN_DURATION: 1,

  // Economy
  GOLD_DROP_MULTIPLIER: 1.2,
  ITEM_SELL_RATIO: 0.5,

  // Progression
  XP_BASE: 100,
  XP_GROWTH_RATE: 1.5,
  MAX_LEVEL: 100
};

// Usage
const damage = baseDamage * BALANCE_CONFIG.CRIT_DAMAGE_MULTIPLIER;
const gold = level * BALANCE_CONFIG.GOLD_DROP_MULTIPLIER;

// ❌ BAD: Magic numbers scattered in code
const damage = baseDamage * 1.5; // What is 1.5? Why 1.5?
const gold = level * 10; // What is 10? Can we adjust it easily?
```

**Key Points:**
- ✅ Create `BALANCE_CONFIG` object in `src/config/balance.ts`
- ✅ Group by system (combat, economy, progression)
- ✅ Use UPPER_SNAKE_CASE for constants
- ✅ Document what each value does
- ✅ Easy to tweak for balancing
- ❌ Never use magic numbers in calculations

---

### 15.11 Combat Logging with Emoji

**Rule:** Use emoji prefixes consistently for combat events to make logs scannable.

```typescript
// Combat action emojis
console.log('⚔️ Basic attack:', damage);
console.log('🔥 Skill used:', skillName);
console.log('💥 Critical hit!');
console.log('🛡️ Blocked/Reduced damage');

// Status effect emojis
console.log('⭐ Buff applied:', effectName);
console.log('💀 Debuff applied:', effectName);
console.log('💨 Effect expired:', effectName);
console.log('🔄 Effect refreshed:', effectName);

// Combat flow emojis
console.log('📊 Turn Order:', turnOrder);
console.log('🎯 Target selected:', targetName);
console.log('✅ Victory!');
console.log('❌ Defeat!');
```

**Standard Emoji Reference:**
- `⚔️` - Basic attack
- `🔥` - Skill usage
- `💥` - Critical hit
- `🛡️` - Defense/damage reduction
- `⭐` - Buff applied
- `💀` - Debuff applied
- `💨` - Effect expired
- `🔄` - Effect refreshed
- `📊` - Statistics/turn order
- `🎯` - Targeting
- `✅` - Success/victory
- `❌` - Failure/defeat
- `⚠️` - Warning
- `ℹ️` - Info
- `💾` - Saving
- `☁️` - Cloud operation

---

### 15.12 Skill AOE Targeting Pattern

**Rule:** Differentiate between single-target, self-buffs, and AOE skills with explicit targeting logic.

```typescript
// ✅ GOOD: Clear skill targeting logic
const useSkill = (skillIndex: number) => {
  const skill = hero.skills[skillIndex];
  let targets: Combatant[] = [];

  // AOE damage skills
  if (skill.name === 'Multi-Shot' || skill.name === 'Chain Lightning' || skill.name === 'Meteor') {
    targets = enemies.filter(e => e.isAlive);
  }
  // AOE buff skills
  else if (skill.name === 'Battle Cry' || skill.name === 'Group Heal') {
    targets = heroes.filter(h => h.isAlive);
  }
  // Self-buffs
  else if (skill.name === 'Evasion' || skill.name === 'Mana Shield' || skill.name === 'Divine Shield') {
    targets = [hero];
  }
  // Single-target damage
  else if (skill.type === 'damage') {
    if (!selectedTarget) {
      alert('Select a target first!');
      return;
    }
    targets = [selectedTarget];
  }
  // Single-target buff
  else if (skill.name === 'Blessing') {
    if (!selectedAlly) {
      alert('Select an ally to buff!');
      return;
    }
    targets = [selectedAlly];
  }

  const result = hero.useSkill(skillIndex, targets);
  // ... handle result
};

// ❌ BAD: Unclear or inconsistent targeting
const useSkill = (skillIndex: number) => {
  const skill = hero.skills[skillIndex];
  const targets = selectedTarget ? [selectedTarget] : enemies;
  // What if it's a buff? What if it's AOE? Unclear!
  hero.useSkill(skillIndex, targets);
};
```

**Key Points:**
- ✅ Check skill type and name explicitly
- ✅ Validate target selection for single-target skills
- ✅ Use `filter(e => e.isAlive)` for AOE to avoid dead targets
- ✅ Self-buffs target `[caster]`, not empty array
- ❌ Never assume target selection is always correct

---

### 15.13 Item Tooltip Display Pattern

**Rule:** Always use the `ItemTooltip` component when displaying items to ensure consistent tooltip behavior across the application.

**Component Location:** `src/components/ui/ItemTooltip.tsx`

**Implementation:**

```typescript
import { ItemTooltip } from '../ui/ItemTooltip';

// 1. Add tooltip state
const [tooltip, setTooltip] = useState<{ item: Item; x: number; y: number } | null>(null);

// 2. Add mouse event handlers to item elements
<div
  onMouseEnter={(e) => setTooltip({ item, x: e.clientX, y: e.clientY })}
  onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
  onMouseLeave={() => setTooltip(null)}
>
  {/* Item card content */}
</div>

// 3. Render tooltip at end of component
{tooltip && (
  <ItemTooltip
    item={tooltip.item}
    x={tooltip.x}
    y={tooltip.y}
    customActions="Click to purchase" // Optional custom action text
  />
)}
```

**Where to Use:**
- ✅ Market building (buy/sell tabs)
- ✅ Inventory screen
- ✅ Equipment slots
- ✅ Enchant/Smithy building
- ✅ Loot rewards
- ✅ Any component displaying Item objects

**Tooltip Content:**
The `ItemTooltip` component automatically displays:
- Item icon and display name (with rarity color)
- Rarity level (Common, Uncommon, Rare, Epic, Legendary, Mythic)
- Slot type and level
- Enchant level (if present)
- Set name (if part of a set)
- All positive stats (HP, ATK, DEF, SPD, CRIT)
- Gold value
- Custom action text (optional)

**Props:**
```typescript
interface ItemTooltipProps {
  item: Item;              // The item to display
  x: number;               // Mouse X position
  y: number;               // Mouse Y position
  showActions?: boolean;   // Show action text (default: true)
  customActions?: string;  // Custom action text (optional)
}
```

**Example:**
```typescript
// Market building buy tab
{tooltip && (
  <ItemTooltip
    item={tooltip.item}
    x={tooltip.x}
    y={tooltip.y}
    customActions="Click to purchase"
  />
)}

// Inventory screen
{tooltip && (
  <ItemTooltip
    item={tooltip.item}
    x={tooltip.x}
    y={tooltip.y}
    customActions="Left-click to equip | Right-click to enchant"
  />
)}
```

**Key Points:**
- ✅ Always use `ItemTooltip` component, never duplicate tooltip code
- ✅ Position tooltip 15px from cursor (handled automatically)
- ✅ Update position on mouse move for smooth following
- ✅ Clear tooltip on mouse leave
- ✅ Use `customActions` prop for context-specific action hints
- ❌ Never create inline tooltips with custom markup
- ❌ Never use `title` attribute for item tooltips

---

### 15.14 Game Modal Display Pattern

**Rule:** Always use the `GameModal` component when displaying modal dialogs to ensure consistent styling and behavior across the application.

**Component Location:** `src/components/ui/GameModal.tsx`

**Features:**
- Consistent styling with game theme (dark gradient, teal border, backdrop blur)
- Click outside to close (configurable)
- Close button in header
- Scrollable body for long content
- Optional emoji icon in title
- Customizable max width

**Implementation:**

```typescript
import { GameModal } from '../ui/GameModal';
import { ModalText, ModalDivider, ModalInfoBox, ModalButton } from '../ui/ModalContent';

// 1. Add modal state
const [showModal, setShowModal] = useState(false);

// 2. Render modal
<GameModal
  isOpen={showModal}
  title="Modal Title"
  icon="🌑" // Optional emoji
  onClose={() => setShowModal(false)}
  maxWidth="600px" // Optional, default: '500px'
  closeOnBackdropClick={true} // Optional, default: true
>
  <ModalText>This is the modal content.</ModalText>
  <ModalDivider />
  <ModalInfoBox variant="info">
    💡 <strong>Tip:</strong> Additional information here.
  </ModalInfoBox>
  <ModalButton onClick={() => setShowModal(false)}>
    OK
  </ModalButton>
</GameModal>
```

**Where to Use:**
- ✅ Confirmations (delete, reset, etc.)
- ✅ Warnings and errors
- ✅ Information dialogs
- ✅ Form dialogs
- ✅ Any popup that blocks interaction with main content

**Modal Content Components:**

The `ModalContent.tsx` file provides styled components for use inside modals:

**ModalText** - Styled paragraph:
```typescript
<ModalText>This is a paragraph of text in the modal.</ModalText>
```

**ModalDivider** - Horizontal divider:
```typescript
<ModalDivider />
```

**ModalInfoBox** - Info box with variants:
```typescript
<ModalInfoBox variant="info">Information message</ModalInfoBox>
<ModalInfoBox variant="warning">Warning message</ModalInfoBox>
<ModalInfoBox variant="success">Success message</ModalInfoBox>
<ModalInfoBox variant="error">Error message</ModalInfoBox>
```

**ModalButton** - Styled button with variants:
```typescript
<ModalButton onClick={handleClick} variant="primary">
  Confirm
</ModalButton>
<ModalButton onClick={handleClick} variant="secondary">
  Cancel
</ModalButton>
<ModalButton onClick={handleClick} variant="danger">
  Delete
</ModalButton>
<ModalButton onClick={handleClick} disabled={true}>
  Disabled
</ModalButton>
```

**Example - Unexplored Area Warning:**
```typescript
<GameModal
  isOpen={showUnexploredModal}
  title={t('worldmap.unexploredTitle')}
  icon="🌑"
  onClose={() => setShowUnexploredModal(false)}
>
  <ModalText>{t('worldmap.unexploredMessage')}</ModalText>
  <ModalDivider />
  <ModalInfoBox variant="info">
    💡 <strong>Tip:</strong> {t('worldmap.unexploredTip')}
  </ModalInfoBox>
  <ModalButton onClick={() => setShowUnexploredModal(false)}>
    OK
  </ModalButton>
</GameModal>
```

**Example - Confirmation Dialog:**
```typescript
<GameModal
  isOpen={showDeleteConfirm}
  title="Delete Item"
  icon="⚠️"
  onClose={() => setShowDeleteConfirm(false)}
  maxWidth="400px"
>
  <ModalText>Are you sure you want to delete this item? This action cannot be undone.</ModalText>
  <ModalDivider />
  <div style={{ display: 'flex', gap: '10px' }}>
    <ModalButton onClick={handleDelete} variant="danger">
      Delete
    </ModalButton>
    <ModalButton onClick={() => setShowDeleteConfirm(false)} variant="secondary">
      Cancel
    </ModalButton>
  </div>
</GameModal>
```

**Key Points:**
- ✅ Always use `GameModal` component, never create custom modals
- ✅ Use `ModalContent` components for consistent styling
- ✅ Always use localization (`t()`) for modal text
- ✅ Add emoji icons to titles for visual context
- ✅ Use appropriate `ModalInfoBox` variants (info, warning, success, error)
- ✅ Use appropriate `ModalButton` variants (primary, secondary, danger)
- ❌ Never duplicate modal styles in components
- ❌ Never create inline modals with custom markup

---

### 15.15. Real-Time Multiplayer Pattern

**Purpose**: Display other online players on the world map with real-time position updates and chat system.

**Components**:
- `useOtherPlayers(userId)` - Hook for subscribing to other players' positions
- `OtherPlayerMarker` - Visual marker showing nickname and level
- `ChatBubble` - Speech bubble appearing above player
- `ChatBox` - Input field for sending chat messages

**Implementation Pattern**:

```tsx
import { useOtherPlayers } from '../hooks/useOtherPlayers';
import { ChatBox } from './ChatBox';
import { supabase } from '../lib/supabase';

function WorldMapComponent() {
  const [gameState, gameActions] = useGameState(userId);

  // Subscribe to other online players
  const otherPlayers = useOtherPlayers(gameState.profile?.user_id);

  // Heartbeat system - Update position every 15 seconds
  useEffect(() => {
    if (!gameState.profile?.user_id) return;

    const updatePresence = async () => {
      await supabase
        .from('player_profiles')
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          current_map_x: gameState.playerPos.x,
          current_map_y: gameState.playerPos.y
        })
        .eq('user_id', gameState.profile.user_id);
    };

    updatePresence();
    const interval = setInterval(updatePresence, 15000);

    // Mark offline on unmount
    return () => {
      clearInterval(interval);
      supabase
        .from('player_profiles')
        .update({ is_online: false })
        .eq('user_id', gameState.profile.user_id);
    };
  }, [gameState.profile?.user_id, gameState.playerPos]);

  // Handle chat messages
  const handleSendMessage = async (message: string) => {
    await supabase
      .from('player_profiles')
      .update({
        current_chat_message: message,
        chat_message_timestamp: new Date().toISOString()
      })
      .eq('user_id', gameState.profile.user_id);
  };

  return (
    <>
      <WorldMapViewer
        worldMap={worldMap}
        playerPosition={playerPos}
        otherPlayers={otherPlayers}
      />
      <ChatBox onSendMessage={handleSendMessage} />
    </>
  );
}
```

**Database Schema**:
```sql
ALTER TABLE player_profiles
ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_online BOOLEAN DEFAULT false,
ADD COLUMN current_map_x INTEGER,
ADD COLUMN current_map_y INTEGER,
ADD COLUMN current_chat_message TEXT,
ADD COLUMN chat_message_timestamp TIMESTAMP WITH TIME ZONE;
```

**Key Rules**:
- ✅ Update presence every 15 seconds (heartbeat)
- ✅ Mark player as offline on component unmount
- ✅ Chat messages auto-expire after 10 seconds
- ✅ Only show players in current viewport
- ✅ Use Supabase Realtime for position subscriptions
- ❌ Never poll database manually - use Realtime subscriptions
- ❌ Never store sensitive data in public profile columns
- ❌ Never render all players globally (only viewport-visible)

---

### 15.16. UI Interaction Patterns

**Purpose**: Standardize common UI interactions for consistency and better UX.

#### Mouse Wheel Zoom Pattern

**When to use**: Canvas-based map or visualization components that benefit from zooming.

**Implementation**:

```typescript
const [zoom, setZoom] = useState(1.0);

/**
 * Handle zoom level changes
 */
const handleZoom = (delta: number) => {
  setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
};

/**
 * Handle mouse wheel zoom
 */
const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  handleZoom(delta);
};

// Apply to canvas
<canvas
  ref={canvasRef}
  onWheel={handleWheel}
  style={styles.canvas}
/>
```

**Key Points**:
- ✅ Prevent default wheel behavior with `e.preventDefault()`
- ✅ Clamp zoom between min/max values (0.5x - 2.0x typical)
- ✅ Use consistent delta increments (0.1 recommended)
- ✅ Wheel down = zoom out, wheel up = zoom in

---

#### Keyboard Shortcuts Pattern

**When to use**: Navigation-heavy applications where users benefit from quick access.

**Implementation**:

```typescript
// Add keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = e.key.toUpperCase();

    // Map keys to screens
    const keyMap: Record<string, GameScreen> = {
      'W': 'worldmap',
      'H': 'heroes',
      'I': 'inventory',
      'T': 'teleport',
      'L': 'leaderboards',
      'Q': 'quests',
      'G': 'guild'
    };

    const screen = keyMap[key];
    if (screen) {
      e.preventDefault();
      onScreenChange(screen);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [onScreenChange]);
```

**Key Points**:
- ✅ Always check if user is typing in input/textarea
- ✅ Use `keydown` event (not `keypress`)
- ✅ Call `preventDefault()` to avoid browser shortcuts
- ✅ Clean up event listener on unmount
- ✅ Include handler dependencies in useEffect array
- ✅ Use intuitive key mappings (W for World, I for Inventory, etc.)
- ❌ Never override critical browser shortcuts (Ctrl+C, Ctrl+V, F5, etc.)

**Visual Indication**:
Display keyboard shortcuts in UI to help users discover them:

```typescript
const menuItems = [
  { id: 'worldmap', icon: '🗺️', label: 'World Map', hotkey: 'W' },
  { id: 'heroes', icon: '🦸', label: 'Heroes', hotkey: 'H' }
];

// Render hotkey badge
{item.hotkey && (
  <span style={styles.hotkey}>{item.hotkey}</span>
)}
```

---

#### Dynamic Info Display Pattern

**When to use**: Status bars, info panels showing live game state.

**Implementation**:

```typescript
// ❌ BAD - Hardcoded placeholder values
<div style={styles.infoPanel}>
  <span>Rank #250</span>
  <span>TODO 15</span>
</div>

// ✅ GOOD - Real-time data from game state
<div style={styles.infoPanel}>
  <div style={styles.infoItem}>
    <span style={styles.infoIcon}>🏆</span>
    <span style={styles.infoText}>Level {gameState.playerLevel}</span>
  </div>
  <div style={styles.infoItem}>
    <span style={styles.infoIcon}>💰</span>
    <span style={styles.infoText}>{gameState.gold.toLocaleString()} Gold</span>
  </div>
</div>
```

**Key Points**:
- ✅ Always use real game state values, never placeholders
- ✅ Format numbers with `toLocaleString()` for thousands separators
- ✅ Use emoji icons for visual clarity
- ✅ Update automatically when state changes
- ❌ Never leave "TODO" or hardcoded test values in production

---

### 15.17 React State Closure Pattern for Async Callbacks

**Rule:** When setting callbacks inside async operations that need current data, capture the data in a closure variable and pass it as a parameter instead of relying on React state.

**Problem:** React state updates are asynchronous. When you set a callback inside an async operation (like `setTimeout`), the callback might capture stale or null state values.

**Pattern:**

```typescript
// ✅ GOOD: Closure variable + parameter passing
const handleAsyncAction = (data: any) => {
  setState(data);  // Update state for UI

  // IMPORTANT: Capture in closure to avoid null reference
  const capturedData = data;  // Capture in closure variable

  setTimeout(() => {
    // Pass captured data directly to callback
    asyncOperation.onComplete = () => handleCallback(capturedData);
  }, 0);
};

const handleCallback = (data?: any) => {
  // Use parameter if provided, fallback to state
  const actualData = data || stateData;
  // Use actualData...
};

// ❌ BAD: Relying on state in closure
const handleAsyncAction = (data: any) => {
  setState(data);

  setTimeout(() => {
    // State might be null or stale when callback executes!
    asyncOperation.onComplete = () => handleCallback();
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

**Real Example - Combat System:**

```typescript
// Router.tsx - Quick combat handler
const handleQuickCombat = (enemies: Enemy[], combatType: string, metadata?: any) => {
  setQuickCombatMetadata(metadata);  // Update state for UI

  // IMPORTANT: Capture metadata in closure to avoid null reference later
  const capturedMetadata = metadata;

  setTimeout(() => {
    combatEngine.initialize(activeHeroes, enemies);

    // Pass captured metadata directly to callback
    combatEngine.onCombatEnd = () => handleQuickCombatEnd(capturedMetadata);

    combatEngine.runAutoCombat();
  }, 0);
};

const handleQuickCombatEnd = async (metadata?: any) => {
  // Use parameter if provided, otherwise fall back to state
  const combatMetadata = metadata || quickCombatMetadata;

  if (combatMetadata && gameState.worldMap) {
    // Mark monster as defeated using reliable metadata
    const updatedWorldMap = { ...gameState.worldMap };
    const objectIndex = updatedWorldMap.dynamicObjects.findIndex(
      obj => obj.position.x === combatMetadata.position.x &&
             obj.position.y === combatMetadata.position.y
    );

    if (objectIndex !== -1) {
      updatedWorldMap.dynamicObjects[objectIndex] = {
        ...updatedWorldMap.dynamicObjects[objectIndex],
        defeated: true
      };
    }

    await gameActions.updateWorldMap(updatedWorldMap);
  }
};
```

**Key Points:**
- ✅ Capture data in `const capturedData = data` before async operation
- ✅ Pass captured data to callback as parameter
- ✅ Accept parameter in callback with fallback: `data || stateData`
- ✅ Document with comment: `// IMPORTANT: Capture in closure to avoid null reference`
- ✅ Use this pattern for combat rewards, metadata, or any critical data
- ❌ Never rely solely on React state in async callbacks
- ❌ Never assume state updates complete before callback executes

**Why this works:**
1. Closure variables are **synchronous** - no async delay
2. Function parameters are **reliable** - passed directly, not through state
3. **Backward compatible** - fallback to state if parameter not provided
4. **Testable** - easy to verify by checking parameter values

**Related Documentation:**
- See [REACT_STATE_CLOSURE_FIX.md](REACT_STATE_CLOSURE_FIX.md) for detailed fix explanation
- See [STATE_MANAGEMENT_FIX.md](STATE_MANAGEMENT_FIX.md) for shared state pattern

---

### 15.18 CSS and Styling Standards

**Rule:** Use design tokens and common style utilities instead of inline style objects to ensure consistency and maintainability.

**Pattern:**

```typescript
// ❌ BAD - Hardcoded inline styles
<div style={{
  backgroundColor: 'rgba(30, 30, 30, 0.9)',
  border: '2px solid #20b2aa',
  borderRadius: '8px',
  padding: '15px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
}}>
  Content
</div>

// ✅ GOOD - Using design tokens and common styles
import { COLORS, SPACING } from '../styles/tokens';
import { cardStyle } from '../styles/common';

<div style={cardStyle}>
  Content
</div>

// ✅ GOOD - Combining common styles with dynamic values
<div style={{
  ...cardStyle,
  borderColor: isActive ? COLORS.borderSuccess : COLORS.borderDark,
  opacity: isCompleted ? 0.6 : 1
}}>
  Content
</div>
```

**File Locations:**
- **Design Tokens**: `src/styles/tokens.ts` - Colors, spacing, fonts, shadows, etc.
- **Common Styles**: `src/styles/common.ts` - Reusable style objects (cards, buttons, flex utilities)

**Design Tokens Available:**

```typescript
import {
  COLORS,           // All color values (backgrounds, borders, text, rarity, etc.)
  SPACING,          // Spacing scale (xxs to xxl)
  BORDER_RADIUS,    // Border radius scale (sm to round)
  FONT_SIZE,        // Font size scale (xs to xxxl)
  FONT_WEIGHT,      // Font weights (normal to bold)
  SHADOWS,          // Shadow presets (sm to glow)
  Z_INDEX,          // Z-index scale (base to notification)
  TRANSITIONS       // Transition presets (fast, base, slow)
} from '../styles/tokens';
```

**Common Style Objects Available:**

```typescript
import {
  cardStyle,                  // Standard card container
  cardLightStyle,            // Light card variant
  buttonStyle,               // Standard button
  buttonDangerStyle,         // Danger button
  buttonSuccessStyle,        // Success button
  buttonDisabledStyle,       // Disabled button
  flexCenter,                // Flex center alignment
  flexRow,                   // Flex row
  flexColumn,                // Flex column
  flexBetween,               // Flex space-between
  flexWrap,                  // Flex wrap with gap
  inputStyle,                // Input field
  modalBackdropStyle,        // Modal backdrop
  modalContentStyle,         // Modal content
  badgeStyle,                // Badge/tag
  tooltipStyle,              // Tooltip
  dividerStyle,              // Horizontal divider
  iconButtonStyle,           // Icon button
  progressBarContainerStyle, // Progress bar container
  progressBarFillStyle,      // Progress bar fill
  gridStyle,                 // Grid layout
  gridColumns(n),            // Grid with n columns
  getRarityColor(rarity),    // Get color for item rarity
  getRoomColor(roomType)     // Get color for room type
} from '../styles/common';
```

**When to Use Each Approach:**

1. **Use Design Tokens** when:
   - Setting colors, spacing, fonts, shadows
   - Ensuring consistency across components
   - Making the app themeable

2. **Use Common Styles** when:
   - Creating cards, buttons, modals
   - Using flex layouts
   - Needing standard UI components

3. **Use Inline Styles** when:
   - Values depend on props/state (dynamic styling)
   - Combining common styles with component-specific overrides
   - One-off styles that won't be reused

**Example - Refactoring Component:**

```typescript
// Before
const styles = {
  container: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    border: '2px solid #20b2aa',
    borderRadius: '8px',
    padding: '15px'
  },
  button: {
    background: 'linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%)',
    border: '2px solid #4a9eff',
    borderRadius: '4px',
    padding: '10px 15px',
    color: '#ffffff',
    cursor: 'pointer'
  }
};

// After
import { COLORS, SPACING } from '../styles/tokens';
import { cardStyle, buttonStyle } from '../styles/common';

const styles = {
  container: cardStyle,
  button: buttonStyle
};

// Or for dynamic styling
<div style={{
  ...cardStyle,
  borderColor: isActive ? COLORS.borderSuccess : COLORS.borderTeal
}}>
```

**Key Points:**
- ✅ Always import from `src/styles/tokens.ts` for design constants
- ✅ Always import from `src/styles/common.ts` for reusable styles
- ✅ Use object spread (`{...cardStyle, ...}`) to compose styles
- ✅ Keep dynamic values (from props/state) in inline styles
- ✅ Document any new tokens or common styles added
- ❌ Never hardcode colors, spacing, or shadows
- ❌ Never duplicate common style patterns across components
- ❌ Never use magic numbers (use tokens instead)

**Helper Functions:**

```typescript
// Get rarity color dynamically
import { getRarityColor } from '../styles/common';

<span style={{ color: getRarityColor(item.rarity) }}>
  {item.name}
</span>

// Get room color dynamically
import { getRoomColor } from '../styles/common';

<div style={{
  ...cardStyle,
  borderColor: getRoomColor(room.type)
}}>
```

**Benefits:**
- ✅ Consistent design across the entire app
- ✅ Easy to change theme (update tokens file)
- ✅ Reduced code duplication
- ✅ Better maintainability
- ✅ TypeScript type safety maintained
- ✅ Easy to find and update specific styles

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)

---

**Remember**: These rules exist to maintain code quality and consistency. If you find a rule that doesn't work, propose a change to this document rather than ignoring the rule.

**Last Updated:** 2025-11-15 (CSS and Styling Standards Added)
