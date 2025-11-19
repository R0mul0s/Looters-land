# 🎯 PHASE 3.5, 4 & 5: Summary Guide

> **Zkrácený manuál pro pokročilé fáze**
>
> Tento dokument obsahuje high-level overview zbylých fází.
> Pro detailní step-by-step implementaci kontaktuj autora.

---

## 🧙 PHASE 3.5: Advanced Features (Continued)

### STEP 3: Resource System (Mana/Energy) - 3-4h

**Cíl:** Přidat mana/energy cost pro skills místo jen cooldowns.

**Key Changes:**
```typescript
// Hero.ts
export class Hero {
  maxMana: number;
  currentMana: number;
  manaRegen: number;  // Per turn

  constructor() {
    this.maxMana = 100;
    this.currentMana = 100;
    this.manaRegen = 10;
  }

  tickMana() {
    this.currentMana = Math.min(this.maxMana, this.currentMana + this.manaRegen);
  }
}

// Skill.ts
export interface Skill {
  manaCost?: number;  // NEW
  energyCost?: number;  // Alternative resource
}

// useSkill logic
if (this.currentMana < skill.manaCost) {
  return null;  // Not enough mana
}
this.currentMana -= skill.manaCost;
```

**UI Changes:**
- Mana bar pod HP barem (modrá)
- Skill buttons show mana cost
- Disable skills when not enough mana
- Mana regen notification v combat logu

---

### STEP 4: Counter-Attacks & Blocking - 3-4h

**Cíl:** Chance to block/counter when attacked.

**Key Mechanics:**
```typescript
// Hero.ts
export class Hero {
  blockChance: number;   // % chance to block (reduce damage)
  counterChance: number; // % chance to counter-attack

  takeDamage(damage: number, isCrit: boolean): number {
    // Roll for block
    if (Math.random() * 100 < this.blockChance) {
      damage = Math.floor(damage * 0.5);  // 50% reduction
      console.log(`🛡️ ${this.name} blocks the attack!`);
    }

    const finalDamage = super.takeDamage(damage, isCrit);

    // Roll for counter (only if still alive)
    if (this.isAlive && Math.random() * 100 < this.counterChance) {
      // Counter-attack logic
      this.counterAttack(attacker);
    }

    return finalDamage;
  }

  counterAttack(target: Combatant) {
    const counterDamage = Math.floor(this.ATK * 0.5);
    target.takeDamage(counterDamage, false);
    console.log(`⚡ ${this.name} counters for ${counterDamage} damage!`);
  }
}
```

**UI:**
- Block/Counter notifications v logu
- Animated shield icon on block
- Counter damage numbers v jiné barvě

---

### STEP 5: Enhanced AI (Boss Phases) - 3-5h

**Cíl:** Boss AI s phase transitions a strategy changes.

**Implementation:**
```typescript
// BossEnemy.ts
export class BossEnemy extends Enemy {
  phase: 1 | 2 | 3;
  phaseSkills: Record<number, Skill[]>;

  updatePhase() {
    const hpPercent = this.currentHP / this.maxHP;

    if (hpPercent < 0.3) {
      this.enterPhase3();  // Desperate
    } else if (hpPercent < 0.6) {
      this.enterPhase2();  // Aggressive
    }
  }

  enterPhase2() {
    if (this.phase === 2) return;
    this.phase = 2;
    this.ATK *= 1.2;  // +20% damage
    console.log(`💀 ${this.name} enters Phase 2! ATK increased!`);
  }

  enterPhase3() {
    if (this.phase === 3) return;
    this.phase = 3;
    this.SPD *= 1.3;  // +30% speed
    console.log(`💀💀 ${this.name} enters FINAL PHASE! SPD increased!`);
  }

  chooseAction(heroes: Combatant[]): CombatActionResult {
    // Phase-based skill priority
    const availableSkills = this.phaseSkills[this.phase];

    // Smart targeting
    if (this.phase === 3) {
      // Phase 3: Target low HP heroes
      const lowestHPHero = heroes
        .filter(h => h.isAlive)
        .reduce((lowest, h) => h.currentHP < lowest.currentHP ? h : lowest);

      return this.useSpecialSkill(availableSkills[0], lowestHPHero);
    }

    // Default behavior
    return super.chooseAction(heroes);
  }
}
```

**Boss Features:**
- Phase transitions at 60% and 30% HP
- Phase-specific skills unlock
- Stat boosts per phase
- Unique boss mechanics (enrage, summon adds, etc.)

---

## 🔧 PHASE 4: Component Refactoring

> ⏱️ 8-12 hodin | 🟢 Priorita: LOW (ale důležité)

### Cíl
Refactor combat kódu do separate, testable components.

### Key Tasks

#### 4.1 Create Dedicated CombatScreen Component
```
src/components/combat/CombatScreen.tsx

- Extract ALL combat UI from Router.tsx
- Props: combatEngine, heroes, enemies, onVictory, onDefeat
- Cleaner separation of concerns
- Easier to test
```

#### 4.2 Split Dungeon vs Quick Combat
```
src/components/combat/DungeonCombat.tsx
src/components/combat/QuickCombat.tsx

- Different victory/defeat handling
- Different loot systems
- Shared CombatEngine logic
```

#### 4.3 State Management with Zustand
```typescript
// src/stores/combatStore.ts
import create from 'zustand';

interface CombatState {
  isActive: boolean;
  combatEngine: CombatEngine | null;
  combatSpeed: CombatSpeed;
  comboCount: number;
  // ... all combat state

  actions: {
    startCombat: (heroes, enemies) => void;
    endCombat: () => void;
    setSpeed: (speed) => void;
    // ... all combat actions
  };
}

export const useCombatStore = create<CombatState>((set, get) => ({
  // ... implementation
}));
```

**Benefits:**
- Centralized combat state
- No prop drilling
- Easier debugging
- Better performance (selective re-renders)

#### 4.4 Unit Tests
```typescript
// __tests__/combat/CombatEngine.test.ts
describe('CombatEngine', () => {
  it('should initialize with heroes and enemies', () => {
    const engine = new CombatEngine();
    engine.initialize(heroes, enemies);

    expect(engine.isActive).toBe(true);
    expect(engine.heroes.length).toBe(3);
  });

  it('should calculate turn order correctly', () => {
    // Test initiative sorting
  });

  it('should apply combo damage correctly', () => {
    // Test combo multiplier
  });
});
```

#### 4.5 Performance Optimizations
- React.memo na všech combat komponentách
- useMemo pro expensive calculations
- useCallback pro event handlers
- Debounce damage number updates
- Virtualize long combat logs

---

## 🎉 PHASE 5: Meta Features

> ⏱️ 12-16 hodin | 🟢 Priorita: LOW

### Cíl
Replayability, polish, a extra features.

### 5.1 Combat Challenges & Achievements - 4-5h

**Implementation:**
```typescript
// src/types/challenges.types.ts
export interface CombatChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: CombatStats) => boolean;
  reward: {
    gold?: number;
    xp?: number;
    item?: Item;
    title?: string;
  };
}

export const COMBAT_CHALLENGES: CombatChallenge[] = [
  {
    id: 'flawless_victory',
    name: 'Flawless Victory',
    description: 'Win without taking any damage',
    icon: '🏆',
    condition: (stats) => stats.totalDamageTaken === 0,
    reward: { gold: 1000, xp: 500 }
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Win in 5 turns or less',
    icon: '⚡',
    condition: (stats) => stats.turnCount <= 5,
    reward: { gold: 500, xp: 250 }
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Reach 10x combo',
    icon: '💥',
    condition: (stats) => stats.maxCombo >= 10,
    reward: { gold: 1500, xp: 1000 }
  }
  // ... more challenges
];
```

**UI:** Challenge completion popups, challenge tracker screen

---

### 5.2 Post-Combat Statistics Screen - 2-3h

**Display:**
- Total damage dealt/taken
- Healing done
- Crits landed
- Skills used
- Accuracy %
- MVP (hero with most damage)
- Combat duration
- Max combo reached
- Challenges completed

**Implementation:**
```typescript
// Track stats during combat
export class CombatEngine {
  statistics: {
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalHealing: number;
    critsLanded: number;
    skillsUsed: number;
    attacksMissed: number;
    turnCount: number;
    maxCombo: number;
    heroStats: Map<string, HeroStats>;
  };
}
```

---

### 5.3 Combat Replay/Timeline - 3-4h

**Feature:** Save and replay entire combat.

```typescript
// Record all actions
export interface CombatRecording {
  turns: Array<{
    turnNumber: number;
    actions: CombatActionResult[];
    snapshot: {
      heroes: CharacterSnapshot[];
      enemies: CharacterSnapshot[];
    };
  }>;
}

// Playback
function replayCombat(recording: CombatRecording) {
  // Step through turns
  // Show HP changes
  // Visualize damage
}
```

**UI:** Timeline scrubber, play/pause, speed control

---

### 5.4 Keyboard Shortcuts - 1-2h

**Shortcuts:**
```
1-5: Use skills 1-5
Space: Basic attack
Tab: Cycle targets
A: Toggle auto-combat
S: Open statistics
ESC: Pause/menu
```

**Implementation:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!combatActive || !waitingForInput) return;

    switch(e.key) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        const skillIndex = parseInt(e.key) - 1;
        if (activeCharacter && 'useSkill' in activeCharacter) {
          useSkill(skillIndex);
        }
        break;

      case ' ':
        e.preventDefault();
        executeBasicAttack();
        break;

      case 'Tab':
        e.preventDefault();
        cycleTarget();
        break;

      case 'a':
      case 'A':
        toggleAutoCombat();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [combatActive, waitingForInput]);
```

---

### 5.5 Difficulty Modifiers - 2-3h

**Feature:** Optional modifiers pre combat.

```typescript
export interface DifficultyModifier {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: {
    enemyHP?: number;    // % multiplier
    enemyATK?: number;
    enemyDEF?: number;
    playerHP?: number;
    xpReward?: number;   // % multiplier
    goldReward?: number;
  };
}

export const DIFFICULTY_MODIFIERS: DifficultyModifier[] = [
  {
    id: 'ironman',
    name: 'Iron Man',
    description: 'No healing allowed',
    icon: '🔒',
    effects: { xpReward: 150, goldReward: 150 }
  },
  {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'Double damage dealt and taken',
    icon: '💎',
    effects: { xpReward: 200, goldReward: 200 }
  }
];
```

**UI:** Modifier selection modal before combat start

---

## 📊 Final Checklist

### Všechny fáze dokončeny?

**PHASE 1: UI/UX**
- [ ] Combat speed controls
- [ ] Initiative order bar
- [ ] Active highlighting
- [ ] Responsive layout
- [ ] Tooltips

**PHASE 2: Mechanics**
- [ ] Accuracy/Evasion
- [ ] Elemental damage
- [ ] Damage animations
- [ ] Status effect icons
- [ ] Enhanced combat log

**PHASE 3: Advanced**
- [ ] Formation/Positioning
- [ ] Combo system
- [ ] Resource system (mana)
- [ ] Counter-attacks
- [ ] Boss AI phases

**PHASE 4: Refactoring**
- [ ] CombatScreen component
- [ ] Zustand state management
- [ ] Unit tests
- [ ] Performance optimizations

**PHASE 5: Meta**
- [ ] Challenges/Achievements
- [ ] Statistics screen
- [ ] Combat replay
- [ ] Keyboard shortcuts
- [ ] Difficulty modifiers

---

## 🎓 Implementation Strategy

### Recommended Order:
1. **Start with PHASE 1** - Immediate visual improvements
2. **Then PHASE 2** - Core mechanics that add depth
3. **Then PHASE 3 Steps 1-2** - Positioning and combos (most impactful)
4. **Then PHASE 4** - Refactor before adding more features
5. **Then PHASE 3 Steps 3-5** - Resource system and AI
6. **Finally PHASE 5** - Polish and meta features

### Time Estimates:
- **Part-time (10h/week):** 9-14 týdnů
- **Full-time (40h/week):** 5-7 týdnů
- **Sprint mode (60h/week):** 3-4 týdny

---

## 🚀 Quick Start

```bash
# 1. Checkout branch
git checkout -b feature/combat-improvements

# 2. Install dependencies
npm install framer-motion react-tooltip zustand

# 3. Start with PHASE 1
code docs/combat-improvements/PHASE_1_UI_UX.md

# 4. Follow step-by-step instructions
# 5. Test after each step
# 6. Commit after each phase
```

---

## 💡 Tips & Tricks

### Testing Strategy
- Manual test každý step před pokračováním
- Keep dungeon combat and worldmap combat separate initially
- Test on mobile after každá UI změna
- Use React DevTools Profiler pro performance

### Git Workflow
```bash
# Feature branches per phase
git checkout -b feat/combat-phase-1
git checkout -b feat/combat-phase-2
# etc.

# Merge to main after testing
git checkout main
git merge feat/combat-phase-1
```

### Debugging
- Add debug mode: `window.__DEBUG_COMBAT = true`
- Log all combat actions to console in debug mode
- Add combat state inspector panel
- Record combat sessions for bug reports

---

## 📞 Support

Máš otázky nebo potřebuješ pomoct s implementací?

- **Email:** roman@rhsoft.cz
- **GitHub Issues:** [looters-land/issues](...)
- **Discord:** #combat-dev

---

## 🎉 Gratulace!

Když dokončíš všech 5 fází, budeš mít **modern, tactical, deep combat system** který soupeří s AAA RPG hrami! 🏆

**Good luck and happy coding!** 🚀
