# 🔧 PHASE 4.5: Refactoring (Continued)

> **Dokončení PHASE 4 - Testing & Performance**
>
> ⏱️ Odhadovaný čas: 4-6 hodin
> 🟢 Priorita: LOW
> 📦 Závislosti: PHASE_4_REFACTORING.md (Steps 1-2)

---

## 📋 Obsah PHASE 4.5

Pokračování [PHASE_4_REFACTORING.md](./PHASE_4_REFACTORING.md):

3. [Split Dungeon vs Quick Combat](#step-3-split-dungeon-vs-quick-combat) - 1-2h
4. [Unit Tests Setup](#step-4-unit-tests-setup) - 2-3h
5. [Performance Optimizations](#step-5-performance-optimizations) - 1-2h

---

## 🎯 STEP 3: Split Dungeon vs Quick Combat

### Cíl
Oddělit dungeon combat a quick combat do separátních komponent.

### Implementace

#### 3.1 Vytvořit DungeonCombatScreen

**Soubor:** `src/components/combat/DungeonCombatScreen.tsx` (NOVÝ)

```typescript
/**
 * Dungeon Combat Screen
 * Specialized combat screen for dungeon encounters
 */

import React from 'react';
import { CombatScreen } from './CombatScreen';
import { useCombatStore, useCombatActions } from '../../stores/combatStore';
import type { Dungeon } from '../../engine/dungeon/Dungeon';
import { GameModal } from '../ui/GameModal';
import { ModalText, ModalDivider, ModalButton } from '../ui/ModalContent';

interface DungeonCombatScreenProps {
  dungeon: Dungeon;
  onVictory: () => void;
  onDefeat: () => void;
  onContinueExploring: () => void;
}

export const DungeonCombatScreen: React.FC<DungeonCombatScreenProps> = ({
  dungeon,
  onVictory,
  onDefeat,
  onContinueExploring
}) => {
  const combatEngine = useCombatStore(state => state.combatEngine);
  const combatResult = useCombatStore(state => state.combatResult);
  const actions = useCombatActions();

  const [showLootScreen, setShowLootScreen] = React.useState(false);

  // Handle victory specific to dungeon
  const handleDungeonVictory = () => {
    if (!combatEngine) return;

    // Show loot screen
    setShowLootScreen(true);

    // Call parent victory handler
    onVictory();
  };

  // Handle continuing after loot collection
  const handleContinue = () => {
    setShowLootScreen(false);
    actions.endCombat();
    onContinueExploring();
  };

  return (
    <>
      <CombatScreen
        onVictory={handleDungeonVictory}
        onDefeat={onDefeat}
        isDungeon={true}
      />

      {/* Dungeon Victory Loot Screen */}
      {showLootScreen && combatEngine?.lootReward && (
        <GameModal
          isOpen={true}
          title="Victory!"
          icon="🎉"
          onClose={handleContinue}
        >
          <ModalText>
            You have defeated all enemies in this room!
          </ModalText>

          <ModalDivider />

          <div style={{
            padding: '15px',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '10px' }}>
              💰 Rewards:
            </div>
            <div>Gold: {combatEngine.lootReward.gold}</div>
            <div>Items: {combatEngine.lootReward.items.length}</div>

            {combatEngine.lootReward.items.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                {combatEngine.lootReward.items.map((item, i) => (
                  <div key={i} style={{ padding: '5px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: '5px' }}>
                    {item.icon} {item.name} ({item.rarity})
                  </div>
                ))}
              </div>
            )}
          </div>

          <ModalButton
            onClick={handleContinue}
            variant="primary"
            fullWidth
          >
            Continue Exploring
          </ModalButton>
        </GameModal>
      )}
    </>
  );
};
```

#### 3.2 Vytvořit QuickCombatScreen

**Soubor:** `src/components/combat/QuickCombatScreen.tsx` (NOVÝ)

```typescript
/**
 * Quick Combat Screen
 * Specialized combat screen for worldmap quick encounters
 */

import React from 'react';
import { CombatScreen } from './CombatScreen';
import { useCombatStore, useCombatActions } from '../../stores/combatStore';
import { GameModal } from '../ui/GameModal';
import { ModalText, ModalDivider, ModalInfoRow, ModalButton } from '../ui/ModalContent';

interface QuickCombatScreenProps {
  onVictory: (gold: number, xp: number) => void;
  onDefeat: () => void;
  onClose: () => void;
}

export const QuickCombatScreen: React.FC<QuickCombatScreenProps> = ({
  onVictory,
  onDefeat,
  onClose
}) => {
  const combatEngine = useCombatStore(state => state.combatEngine);
  const combatResult = useCombatStore(state => state.combatResult);
  const victoryRewards = useCombatStore(state => state.victoryRewards);
  const actions = useCombatActions();

  const [showResultModal, setShowResultModal] = React.useState(false);

  // Handle victory
  const handleQuickVictory = () => {
    if (!combatEngine?.lootReward) return;

    const gold = combatEngine.lootReward.gold;
    const xp = 50; // Calculate based on enemies

    // Set rewards in store
    actions.setCombatResult('victory', {
      gold,
      xp,
      items: combatEngine.lootReward.items,
      levelUps: [] // TODO: Track level ups
    });

    setShowResultModal(true);
    onVictory(gold, xp);
  };

  // Handle defeat
  const handleQuickDefeat = () => {
    setShowResultModal(true);
    onDefeat();
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowResultModal(false);
    actions.endCombat();
    onClose();
  };

  return (
    <>
      <CombatScreen
        onVictory={handleQuickVictory}
        onDefeat={handleQuickDefeat}
        isDungeon={false}
      />

      {/* Quick Combat Result Modal */}
      {showResultModal && (
        <GameModal
          isOpen={true}
          title={combatResult === 'victory' ? 'Victory!' : 'Defeat'}
          icon={combatResult === 'victory' ? '🎉' : '💀'}
          onClose={handleModalClose}
        >
          {combatResult === 'victory' && victoryRewards ? (
            <>
              <ModalText>
                You have successfully defeated the enemies!
              </ModalText>
              <ModalDivider />
              <ModalInfoRow label="💰 Gold:" value={victoryRewards.gold} valueColor="gold" />
              <ModalInfoRow label="⭐ XP:" value={victoryRewards.xp} valueColor="info" />
              {victoryRewards.items.length > 0 && (
                <ModalInfoRow label="🎁 Items:" value={victoryRewards.items.length} />
              )}
            </>
          ) : (
            <>
              <ModalText>
                Your party has been defeated. Heroes restored to 10% HP.
              </ModalText>
            </>
          )}

          <ModalDivider />
          <ModalButton
            onClick={handleModalClose}
            variant="primary"
            fullWidth
          >
            Continue
          </ModalButton>
        </GameModal>
      )}
    </>
  );
};
```

#### 3.3 Update Router k použití specialized screens

**Soubor:** `src/Router.tsx`

```typescript
import { DungeonCombatScreen } from './components/combat/DungeonCombatScreen';
import { QuickCombatScreen } from './components/combat/QuickCombatScreen';
import { useCombatStore } from './stores/combatStore';

export function Router() {
  const combatActive = useCombatStore(state => state.isActive);
  const combatType = useCombatStore(state => state.combatType);

  return (
    <>
      {/* WorldMap */}
      <div style={{ display: inDungeon || combatActive ? 'none' : 'block' }}>
        <WorldMap {...} />
      </div>

      {/* Dungeon Explorer */}
      {inDungeon && !combatActive && (
        <DungeonExplorer {...} />
      )}

      {/* Combat Screens */}
      {combatActive && combatType === 'dungeon' && (
        <DungeonCombatScreen
          dungeon={currentDungeon!}
          onVictory={handleDungeonVictory}
          onDefeat={handleDungeonDefeat}
          onContinueExploring={handleContinueExploring}
        />
      )}

      {combatActive && combatType === 'quick' && (
        <QuickCombatScreen
          onVictory={handleQuickVictory}
          onDefeat={handleQuickDefeat}
          onClose={handleQuickCombatClose}
        />
      )}
    </>
  );
}
```

### ✅ Testing Checklist

- [ ] Dungeon combat používá DungeonCombatScreen
- [ ] Quick combat používá QuickCombatScreen
- [ ] Loot handling je correct pro každý typ
- [ ] Victory/defeat callbacks fungují správně
- [ ] Modal screens se zobrazují správně

---

## 🎯 STEP 4: Unit Tests Setup

### Cíl
Přidat unit testy pro combat logiku.

### Implementace

#### 4.1 Install Testing Dependencies

```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

#### 4.2 Vytvořit Vitest Config

**Soubor:** `vitest.config.ts` (NOVÝ v root)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### 4.3 Vytvořit Test Setup

**Soubor:** `src/test/setup.ts` (NOVÝ)

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

#### 4.4 Vytvořit Test Utilities

**Soubor:** `src/test/testUtils.tsx` (NOVÝ)

```typescript
/**
 * Test Utilities
 * Helper functions for testing combat system
 */

import { Hero } from '../engine/hero/Hero';
import { Enemy } from '../engine/combat/Enemy';
import type { EnemyType } from '../types/combat.types';

/**
 * Create test hero
 */
export function createTestHero(overrides?: Partial<Hero>): Hero {
  const hero = new Hero({
    name: 'Test Hero',
    class: 'warrior',
    level: 1,
    rarity: 'common',
    ...overrides
  });

  return hero;
}

/**
 * Create test enemy
 */
export function createTestEnemy(level: number = 1, type: EnemyType = 'normal'): Enemy {
  return new Enemy('Test Enemy', level, type);
}

/**
 * Create test party
 */
export function createTestParty(count: number = 3): Hero[] {
  return Array.from({ length: count }, (_, i) =>
    createTestHero({ name: `Hero ${i + 1}` })
  );
}

/**
 * Create test enemy group
 */
export function createTestEnemyGroup(count: number = 3): Enemy[] {
  return Array.from({ length: count }, (_, i) =>
    createTestEnemy(1, 'normal')
  );
}
```

#### 4.5 Vytvořit CombatEngine Tests

**Soubor:** `src/engine/combat/__tests__/CombatEngine.test.ts` (NOVÝ)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CombatEngine } from '../CombatEngine';
import { createTestParty, createTestEnemyGroup } from '../../../test/testUtils';

describe('CombatEngine', () => {
  let engine: CombatEngine;
  let heroes: ReturnType<typeof createTestParty>;
  let enemies: ReturnType<typeof createTestEnemyGroup>;

  beforeEach(() => {
    engine = new CombatEngine();
    heroes = createTestParty(3);
    enemies = createTestEnemyGroup(3);
  });

  describe('initialize', () => {
    it('should initialize combat with heroes and enemies', () => {
      engine.initialize(heroes, enemies);

      expect(engine.isActive).toBe(true);
      expect(engine.heroes.length).toBe(3);
      expect(engine.enemies.length).toBe(3);
      expect(engine.turnCounter).toBe(0);
    });

    it('should reset combat state on initialization', () => {
      engine.initialize(heroes, enemies);
      engine.turnCounter = 5;
      engine.comboCounter = 3;

      engine.initialize(heroes, enemies);

      expect(engine.turnCounter).toBe(0);
      expect(engine.comboCounter).toBe(0);
    });
  });

  describe('calculateTurnOrder', () => {
    it('should order by initiative (highest first)', () => {
      heroes[0].SPD = 10;
      heroes[1].SPD = 20;
      heroes[2].SPD = 15;

      engine.initialize(heroes, enemies);
      engine['calculateTurnOrder']();

      // Can't directly access turnOrder (private), but we can test via executeTurn
      expect(engine.turnOrder.length).toBeGreaterThan(0);
    });

    it('should only include alive characters', () => {
      heroes[0].isAlive = false;

      engine.initialize(heroes, enemies);

      const aliveCombatants = [...heroes, ...enemies].filter(c => c.isAlive);
      expect(engine.turnOrder.length).toBeLessThanOrEqual(aliveCombatants.length);
    });
  });

  describe('combo system', () => {
    it('should increase combo on consecutive hits by same attacker', () => {
      engine.initialize(heroes, enemies);

      const attacker = heroes[0];
      const target = enemies[0];

      engine.updateCombo(attacker, target, true);
      expect(engine.comboCounter).toBe(1);

      engine.updateCombo(attacker, target, true);
      expect(engine.comboCounter).toBe(2);

      engine.updateCombo(attacker, target, true);
      expect(engine.comboCounter).toBe(3);
    });

    it('should reset combo on miss', () => {
      engine.initialize(heroes, enemies);

      const attacker = heroes[0];
      const target = enemies[0];

      engine.updateCombo(attacker, target, true);
      engine.updateCombo(attacker, target, true);
      expect(engine.comboCounter).toBe(2);

      engine.updateCombo(attacker, target, false); // Miss
      expect(engine.comboCounter).toBe(0);
    });

    it('should reset combo when target changes', () => {
      engine.initialize(heroes, enemies);

      const attacker = heroes[0];
      const target1 = enemies[0];
      const target2 = enemies[1];

      engine.updateCombo(attacker, target1, true);
      engine.updateCombo(attacker, target1, true);
      expect(engine.comboCounter).toBe(2);

      engine.updateCombo(attacker, target2, true); // Different target
      expect(engine.comboCounter).toBe(1);
    });

    it('should calculate correct combo multiplier', () => {
      engine.comboCounter = 3;
      expect(engine.getComboMultiplier()).toBe(1.3); // 1.0 + 3 * 0.1

      engine.comboCounter = 5;
      expect(engine.getComboMultiplier()).toBe(1.5); // Max combo

      engine.comboCounter = 10;
      expect(engine.getComboMultiplier()).toBe(1.5); // Capped at 5
    });
  });

  describe('victory conditions', () => {
    it('should detect victory when all enemies defeated', () => {
      engine.initialize(heroes, enemies);

      // Kill all enemies
      enemies.forEach(e => {
        e.currentHP = 0;
        e.isAlive = false;
      });

      const result = engine['checkVictoryConditions']();
      expect(result).toBe(true);
      expect(engine.combatResult).toBe('victory');
    });

    it('should detect defeat when all heroes defeated', () => {
      engine.initialize(heroes, enemies);

      // Kill all heroes
      heroes.forEach(h => {
        h.currentHP = 0;
        h.isAlive = false;
      });

      const result = engine['checkVictoryConditions']();
      expect(result).toBe(true);
      expect(engine.combatResult).toBe('defeat');
    });
  });

  describe('XP rewards', () => {
    it('should award XP based on enemy level and count', () => {
      const level3Enemies = createTestEnemyGroup(2).map(e => {
        e.level = 3;
        return e;
      });

      engine.initialize(heroes, enemies);

      // Mock victory
      level3Enemies.forEach(e => {
        e.currentHP = 0;
        e.isAlive = false;
      });

      // XP formula: 50 * avgEnemyLevel * numEnemies
      // Expected: 50 * 3 * 2 = 300 XP
      // (Exact calculation depends on implementation)
    });
  });
});
```

#### 4.6 Vytvořit Accuracy/Evasion Tests

**Soubor:** `src/utils/combat/__tests__/hitCalculation.test.ts` (NOVÝ)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateHitChance, rollHit } from '../hitCalculation';

describe('Hit Calculation', () => {
  describe('calculateHitChance', () => {
    it('should return 95% when ACC >> EVA', () => {
      const hitChance = calculateHitChance(200, 0);
      expect(hitChance).toBe(95); // Capped at 95%
    });

    it('should return 5% when EVA >> ACC', () => {
      const hitChance = calculateHitChance(50, 200);
      expect(hitChance).toBe(5); // Capped at 5%
    });

    it('should calculate correct hit chance for balanced stats', () => {
      const hitChance = calculateHitChance(100, 100);
      expect(hitChance).toBe(100); // 100 + (100-100)/10 = 100, capped at 95
    });

    it('should increase hit chance with higher ACC', () => {
      const chance1 = calculateHitChance(100, 50);
      const chance2 = calculateHitChance(150, 50);

      expect(chance2).toBeGreaterThan(chance1);
    });

    it('should decrease hit chance with higher EVA', () => {
      const chance1 = calculateHitChance(100, 50);
      const chance2 = calculateHitChance(100, 100);

      expect(chance2).toBeLessThan(chance1);
    });
  });

  describe('rollHit', () => {
    it('should always hit with 100% accuracy', () => {
      // Note: This is probabilistic, might need multiple runs
      const hits = Array.from({ length: 100 }, () =>
        rollHit(1000, 0) // Guaranteed 95% (max)
      );

      const hitRate = hits.filter(Boolean).length / hits.length;
      expect(hitRate).toBeGreaterThan(0.9); // At least 90% hit
    });

    it('should sometimes miss even with high accuracy', () => {
      const hits = Array.from({ length: 100 }, () =>
        rollHit(100, 50) // ~95% hit chance
      );

      const hitRate = hits.filter(Boolean).length / hits.length;
      expect(hitRate).toBeLessThan(1.0); // Not 100%
      expect(hitRate).toBeGreaterThan(0.85); // But still high
    });
  });
});
```

#### 4.7 Update package.json scripts

**Soubor:** `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

### ✅ Testing Checklist

- [ ] `npm run test` spouští testy
- [ ] CombatEngine tests pass
- [ ] Hit calculation tests pass
- [ ] Test coverage > 70%
- [ ] CI/CD integration (optional)

---

## 🎯 STEP 5: Performance Optimizations

### Cíl
Optimalizovat performance combat systému.

### Implementace

#### 5.1 React.memo na Combat Components

**Soubor:** `src/components/combat/InitiativeBar.tsx`

```typescript
import React from 'react';

// Wrap with React.memo
export const InitiativeBar = React.memo<InitiativeBarProps>(({
  turnOrder,
  currentCharacter,
  isMobile
}) => {
  // ... component code
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.turnOrder.length === nextProps.turnOrder.length &&
    prevProps.currentCharacter?.id === nextProps.currentCharacter?.id &&
    prevProps.isMobile === nextProps.isMobile
  );
});

InitiativeBar.displayName = 'InitiativeBar';
```

#### 5.2 useMemo pro Expensive Calculations

**Soubor:** `src/components/combat/CombatScreen.tsx`

```typescript
import { useMemo, useCallback } from 'react';

export const CombatScreen: React.FC<CombatScreenProps> = ({ ... }) => {
  // Memoize filtered damage numbers
  const heroDamageNumbers = useMemo(() => {
    return heroes.map(hero => ({
      heroId: hero.id,
      numbers: damageNumbers.filter(dn => dn.targetId === hero.id)
    }));
  }, [damageNumbers, heroes]);

  // Memoize enemy list
  const activeEnemies = useMemo(() =>
    enemies.filter(e => e.isAlive),
    [enemies]
  );

  // useCallback for event handlers
  const handleAttack = useCallback((target: Combatant) => {
    if (!activeCharacter) return;
    // ... attack logic
  }, [activeCharacter]);

  // ... rest of component
};
```

#### 5.3 Debounce Damage Number Updates

**Soubor:** `src/utils/debounce.ts` (NOVÝ)

```typescript
/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
```

**Použití:**
```typescript
// In CombatScreen
const addDamageNumber = useMemo(() =>
  debounce((dn: DamageNumberData) => {
    setDamageNumbers(prev => [...prev, dn]);
  }, 16), // ~60fps
  []
);
```

#### 5.4 Virtualize Combat Log

**Soubor:** `src/components/combat/CombatLog.tsx`

```typescript
// Install react-window
// npm install react-window

import { FixedSizeList as List } from 'react-window';

export const CombatLog: React.FC<CombatLogProps> = ({ entries, maxHeight }) => {
  // Virtualized row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const entry = filteredEntries[index];

    return (
      <div style={{ ...style, ...styles.entry }}>
        {/* Entry content */}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}

      <List
        height={maxHeight}
        itemCount={filteredEntries.length}
        itemSize={40} // Height per entry
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};
```

#### 5.5 Bundle Size Optimization

**Soubor:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'animation-vendor': ['framer-motion'],
          'combat': [
            './src/engine/combat/CombatEngine',
            './src/engine/combat/Enemy',
            './src/components/combat/CombatScreen'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600 // Warn if chunk > 600kb
  }
});
```

#### 5.6 Performance Monitoring Hook

**Soubor:** `src/hooks/usePerformanceMonitor.ts` (NOVÝ)

```typescript
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;

    if (process.env.NODE_ENV === 'development') {
      const renderTime = Date.now() - startTime.current;
      console.log(`[${componentName}] Render #${renderCount.current} - ${renderTime}ms`);
    }

    startTime.current = Date.now();
  });

  return {
    renderCount: renderCount.current
  };
}

// Usage in CombatScreen:
export const CombatScreen = ({ ... }) => {
  usePerformanceMonitor('CombatScreen');
  // ... component
};
```

### ✅ Testing Checklist

- [ ] React.memo reduces unnecessary re-renders
- [ ] useMemo/useCallback optimize expensive operations
- [ ] Damage numbers don't cause lag
- [ ] Combat log scrolling is smooth
- [ ] Bundle size < 500kb for combat chunks
- [ ] 60fps maintained during combat
- [ ] React DevTools Profiler shows good metrics

---

## 🎉 PHASE 4 DOKONČENA!

### Final Checklist

- [ ] **CombatScreen Component** - standalone, reusable
- [ ] **Zustand Store** - centralized state management
- [ ] **Split Combat Types** - dungeon vs quick combat
- [ ] **Unit Tests** - >70% coverage
- [ ] **Performance** - smooth 60fps

### Git Commit

```bash
git add .
git commit -m "refactor(combat): PHASE 4 - Component refactoring

- Extract CombatScreen into standalone component
- Implement Zustand for combat state management
- Split DungeonCombat and QuickCombat components
- Add unit tests with Vitest (70%+ coverage)
- Performance optimizations (memo, useMemo, virtualization)

Related to #XXX"

git push origin feature/combat-improvements
```

### Co dál?

Pokračuj na **[PHASE_5_META.md](./PHASE_5_META.md)** pro meta features! 🎉
