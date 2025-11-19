# 🧙 PHASE 3: Advanced Combat Features

> **Strategická hloubka - positioning, combos, enhanced AI**
>
> ⏱️ Odhadovaný čas: 16-24 hodin
> 🟡 Priorita: MEDIUM
> 📦 Závislosti: PHASE 2 (elemental system for combo bonuses)

---

## 📋 Obsah PHASE 3

1. [Formation/Positioning System](#step-1-formationpositioning-system) - 4-5h
2. [Combo Mechanics](#step-2-combo-mechanics) - 3-4h
3. [Resource System (Mana/Energy)](#step-3-resource-system) - 3-4h
4. [Counter-Attacks & Blocking](#step-4-counter-attacks--blocking) - 3-4h
5. [Enhanced AI (Boss Phases)](#step-5-enhanced-ai-boss-phases) - 3-5h

---

## 🎯 STEP 1: Formation/Positioning System

### Cíl
Přidat tactical positioning (Front/Middle/Back rows) s různými bonusy a aggro mechanikou.

### Implementace

#### 1.1 Definovat Position types

**Soubor:** `src/types/combat.types.ts`

```typescript
/**
 * Combat position/formation
 */
export enum Position {
  FRONT = 'front',   // High aggro, takes more damage, deals more physical damage
  MIDDLE = 'middle', // Balanced position
  BACK = 'back'      // Low aggro, takes less damage, deals more spell damage
}

/**
 * Position bonuses
 */
export interface PositionBonuses {
  physicalDamage: number;  // % bonus to physical damage
  spellDamage: number;     // % bonus to spell/magic damage
  damageReduction: number; // % damage reduction
  aggroWeight: number;     // Weight for AI targeting (higher = more likely to be targeted)
}

/**
 * Position configuration
 */
export const POSITION_BONUSES: Record<Position, PositionBonuses> = {
  [Position.FRONT]: {
    physicalDamage: 10,      // +10% physical damage
    spellDamage: -10,        // -10% spell damage
    damageReduction: -10,    // -10% damage reduction (takes MORE damage)
    aggroWeight: 3           // 3x more likely to be targeted
  },
  [Position.MIDDLE]: {
    physicalDamage: 0,
    spellDamage: 0,
    damageReduction: 0,
    aggroWeight: 2
  },
  [Position.BACK]: {
    physicalDamage: -10,     // -10% physical damage
    spellDamage: 15,         // +15% spell damage
    damageReduction: 10,     // +10% damage reduction
    aggroWeight: 1           // Least likely to be targeted
  }
};
```

#### 1.2 Přidat position do Hero

**Soubor:** `src/engine/hero/Hero.ts`

```typescript
import { Position, POSITION_BONUSES } from '../../types/combat.types';

export interface HeroParams {
  // ... existing params
  position?: Position;  // NEW: Starting position
}

export class Hero {
  // ... existing properties

  // ===== NOVÝ KÓD =====
  position: Position;
  // ===== KONEC NOVÉHO KÓDU =====

  constructor(params: HeroParams) {
    // ... existing initialization

    // ===== NOVÝ KÓD: Initialize position based on class =====
    this.position = params.position || this.getDefaultPosition(params.class);
    // ===== KONEC NOVÉHO KÓDU =====
  }

  // ===== NOVÝ KÓD: Get default position for class =====
  private getDefaultPosition(heroClass: string): Position {
    switch (heroClass) {
      case 'warrior':
        return Position.FRONT;    // Warriors in front
      case 'rogue':
        return Position.MIDDLE;   // Rogues in middle
      case 'mage':
      case 'cleric':
        return Position.BACK;     // Casters in back
      default:
        return Position.MIDDLE;
    }
  }

  /**
   * Change position during combat setup
   */
  setPosition(position: Position): void {
    this.position = position;
  }

  /**
   * Get position bonuses
   */
  getPositionBonuses(): PositionBonuses {
    return POSITION_BONUSES[this.position];
  }
  // ===== KONEC NOVÉHO KÓDU =====
}
```

#### 1.3 Přidat position do Enemy

**Soubor:** `src/engine/combat/Enemy.ts`

```typescript
import { Position, POSITION_BONUSES } from '../../types/combat.types';

export class Enemy {
  // ... existing properties

  // ===== NOVÝ KÓD =====
  position: Position;
  // ===== KONEC NOVÉHO KÓDU =====

  constructor(name: string, level: number = 1, type: EnemyType = 'normal') {
    // ... existing initialization

    // ===== NOVÝ KÓD: Position based on enemy type =====
    this.position = this.determinePosition();
    // ===== KONEC NOVÉHO KÓDU =====
  }

  // ===== NOVÝ KÓD =====
  private determinePosition(): Position {
    // Bosses and elites in front (aggressive)
    if (this.type === 'boss' || this.type === 'elite') {
      return Position.FRONT;
    }

    // Normal enemies randomized with bias towards middle
    const roll = Math.random();
    if (roll < 0.3) return Position.FRONT;
    if (roll < 0.8) return Position.MIDDLE;
    return Position.BACK;
  }

  getPositionBonuses(): PositionBonuses {
    return POSITION_BONUSES[this.position];
  }
  // ===== KONEC NOVÉHO KÓDU =====
}
```

#### 1.4 Update damage calculation s position bonuses

**Soubor:** `src/utils/combat/damageCalculation.ts` (NOVÝ)

```typescript
/**
 * Damage Calculation with Position Bonuses
 */

import type { Combatant } from '../../types/combat.types';
import type { Element } from '../../types/combat.types';

/**
 * Calculate final damage with position bonuses
 */
export function calculateDamageWithPosition(
  baseDamage: number,
  attacker: Combatant,
  target: Combatant,
  element: Element,
  isCrit: boolean
): number {
  // Get position bonuses
  const attackerBonuses = 'getPositionBonuses' in attacker
    ? attacker.getPositionBonuses()
    : { physicalDamage: 0, spellDamage: 0, damageReduction: 0, aggroWeight: 1 };

  const targetBonuses = 'getPositionBonuses' in target
    ? target.getPositionBonuses()
    : { physicalDamage: 0, spellDamage: 0, damageReduction: 0, aggroWeight: 1 };

  // Apply attacker position damage bonus
  let damageMultiplier = 1.0;

  if (element === 'physical') {
    damageMultiplier += attackerBonuses.physicalDamage / 100;
  } else {
    // Non-physical elements benefit from spell damage bonus
    damageMultiplier += attackerBonuses.spellDamage / 100;
  }

  // Apply damage
  let finalDamage = baseDamage * damageMultiplier;

  // Apply target position damage reduction
  const reductionMultiplier = 1 - (targetBonuses.damageReduction / 100);
  finalDamage *= reductionMultiplier;

  // Apply crit
  if (isCrit) {
    finalDamage *= 1.5;
  }

  return Math.floor(finalDamage);
}
```

#### 1.5 Update Enemy AI target selection s aggro

**Soubor:** `src/engine/combat/Enemy.ts`

```typescript
/**
 * Choose action with aggro-based targeting
 */
chooseAction(heroes: Combatant[]): CombatActionResult | null {
  const aliveHeroes = heroes.filter(h => h.isAlive);
  if (aliveHeroes.length === 0) return null;

  // ===== ZMĚNA: Use weighted random selection based on aggro =====
  const target = this.selectTargetByAggro(aliveHeroes);
  // ===== KONEC ZMĚNY =====

  return this.attack(target);
}

// ===== NOVÝ KÓD: Aggro-based target selection =====
private selectTargetByAggro(heroes: Combatant[]): Combatant {
  // Get aggro weights
  const weights = heroes.map(hero => {
    const bonuses = 'getPositionBonuses' in hero
      ? hero.getPositionBonuses()
      : { aggroWeight: 1, physicalDamage: 0, spellDamage: 0, damageReduction: 0 };

    // Also factor in HP (lower HP = slightly higher aggro)
    const hpFactor = 1 + (1 - hero.currentHP / hero.maxHP) * 0.3;

    return bonuses.aggroWeight * hpFactor;
  });

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < heroes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return heroes[i];
    }
  }

  // Fallback (shouldn't happen)
  return heroes[0];
}
// ===== KONEC NOVÉHO KÓDU =====
```

#### 1.6 Vytvořit FormationDisplay komponentu

**Soubor:** `src/components/combat/FormationDisplay.tsx` (NOVÝ)

```typescript
/**
 * Formation Display Component
 * Shows party formation with visual positioning
 */
import React from 'react';
import type { Combatant } from '../../types/combat.types';
import { Position, POSITION_BONUSES } from '../../types/combat.types';

interface FormationDisplayProps {
  combatants: Combatant[];
  isEnemyFormation?: boolean;
  onPositionChange?: (combatantId: string, newPosition: Position) => void;
  allowReposition?: boolean;
}

export const FormationDisplay: React.FC<FormationDisplayProps> = ({
  combatants,
  isEnemyFormation = false,
  onPositionChange,
  allowReposition = false
}) => {
  // Group by position
  const front = combatants.filter(c => 'position' in c && c.position === Position.FRONT);
  const middle = combatants.filter(c => 'position' in c && c.position === Position.MIDDLE);
  const back = combatants.filter(c => 'position' in c && c.position === Position.BACK);

  const renderRow = (position: Position, chars: Combatant[]) => {
    const bonuses = POSITION_BONUSES[position];
    const rowName = position.charAt(0).toUpperCase() + position.slice(1);

    return (
      <div style={styles.row}>
        <div style={styles.rowLabel}>
          <div style={{ fontWeight: '600', color: '#a78bfa' }}>
            {rowName} Row
          </div>
          <div style={{ fontSize: '0.7em', color: 'rgba(255, 255, 255, 0.5)' }}>
            Aggro: {bonuses.aggroWeight}x
          </div>
        </div>

        <div style={styles.charContainer}>
          {chars.length === 0 ? (
            <div style={styles.emptySlot}>Empty</div>
          ) : (
            chars.map(char => (
              <div
                key={char.id}
                style={{
                  ...styles.charCard,
                  borderColor: char.isAlive ? (isEnemyFormation ? '#ef4444' : '#3b82f6') : '#666',
                  opacity: char.isAlive ? 1 : 0.5
                }}
              >
                <div style={styles.charName}>{char.name}</div>
                <div style={styles.charHP}>
                  {char.currentHP}/{char.maxHP}
                </div>

                {allowReposition && onPositionChange && (
                  <select
                    value={position}
                    onChange={(e) => onPositionChange(char.id, e.target.value as Position)}
                    style={styles.positionSelect}
                  >
                    <option value={Position.FRONT}>Front</option>
                    <option value={Position.MIDDLE}>Middle</option>
                    <option value={Position.BACK}>Back</option>
                  </select>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {isEnemyFormation ? '👹 Enemy Formation' : '⚔️ Party Formation'}
      </div>

      {renderRow(Position.FRONT, front)}
      {renderRow(Position.MIDDLE, middle)}
      {renderRow(Position.BACK, back)}

      {/* Bonus legend */}
      <div style={styles.legend}>
        <div style={styles.legendTitle}>Position Bonuses:</div>
        <div style={styles.legendItems}>
          <div>🗡️ Front: +10% Phys Dmg, -10% Taken, 3x Aggro</div>
          <div>⚖️ Middle: Balanced, 2x Aggro</div>
          <div>🔮 Back: +15% Spell Dmg, +10% Def, 1x Aggro</div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(17, 24, 39, 0.8)',
    borderRadius: '12px',
    padding: '15px',
    border: '2px solid rgba(139, 92, 246, 0.3)'
  },
  header: {
    fontSize: '1.1em',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#a78bfa',
    textAlign: 'center'
  },
  row: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px'
  },
  rowLabel: {
    minWidth: '80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    fontSize: '0.85em'
  },
  charContainer: {
    flex: 1,
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  charCard: {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid',
    borderRadius: '8px',
    minWidth: '100px',
    fontSize: '0.85em'
  },
  charName: {
    fontWeight: '600',
    marginBottom: '4px'
  },
  charHP: {
    fontSize: '0.8em',
    color: 'rgba(255, 255, 255, 0.6)'
  },
  positionSelect: {
    marginTop: '6px',
    width: '100%',
    padding: '4px',
    fontSize: '0.75em',
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  emptySlot: {
    padding: '8px 12px',
    color: 'rgba(255, 255, 255, 0.3)',
    fontStyle: 'italic',
    fontSize: '0.85em'
  },
  legend: {
    marginTop: '15px',
    padding: '10px',
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '8px',
    fontSize: '0.8em'
  },
  legendTitle: {
    fontWeight: '600',
    marginBottom: '6px',
    color: '#a78bfa'
  },
  legendItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    color: 'rgba(255, 255, 255, 0.7)'
  }
};
```

#### 1.7 Přidat formation setup před combat

**Soubor:** `src/Router.tsx`

```typescript
import { FormationDisplay } from './components/combat/FormationDisplay';

// State pro formation setup (cca řádek 85)
const [showFormationSetup, setShowFormationSetup] = useState(false);
const [formationHeroes, setFormationHeroes] = useState<Hero[]>([]);

// Funkce pro změnu pozice
const handlePositionChange = (heroId: string, newPosition: Position) => {
  setFormationHeroes(prev => prev.map(hero =>
    hero.id === heroId ? { ...hero, position: newPosition } : hero
  ));
};

// Modal pro formation setup (před combat start)
{showFormationSetup && (
  <GameModal
    isOpen={true}
    title="⚔️ Setup Formation"
    icon="🛡️"
    onClose={() => setShowFormationSetup(false)}
  >
    <ModalText>
      Position your party before combat. Front row takes more damage but deals more physical damage.
    </ModalText>

    <FormationDisplay
      combatants={formationHeroes}
      allowReposition={true}
      onPositionChange={handlePositionChange}
    />

    <ModalDivider />
    <ModalButton
      onClick={() => {
        // Apply formation and start combat
        gameActions.updateActiveParty(formationHeroes, false);
        setShowFormationSetup(false);
        // Start combat...
      }}
      variant="primary"
      fullWidth
    >
      Start Combat
    </ModalButton>
  </GameModal>
)}
```

### ✅ Testing Checklist

- [ ] Heroes mají default positions based on class
- [ ] Enemies mají random positions (bias to middle)
- [ ] Front row enemies jsou targeted více často
- [ ] Back row enemies jsou targeted méně často
- [ ] Position bonuses se aplikují na damage
- [ ] Formation display zobrazuje správné rows
- [ ] Formation setup modal funguje
- [ ] Position změny se uloží
- [ ] Aggro weighting funguje v enemy AI

---

## 🎯 STEP 2: Combo Mechanics

### Cíl
Přidat combo counter systém - consecutive hits od stejné postavy zvyšují damage.

### Implementace

#### 2.1 Přidat combo state do CombatEngine

**Soubor:** `src/engine/combat/CombatEngine.ts`

```typescript
export class CombatEngine {
  // ... existing properties

  // ===== NOVÝ KÓD: Combo system =====
  comboCounter: number;
  lastAttacker: Combatant | null;
  comboTarget: Combatant | null;
  maxComboReached: number;  // Track highest combo in this fight
  // ===== KONEC NOVÉHO KÓDU =====

  constructor() {
    // ... existing initialization

    // ===== NOVÝ KÓD =====
    this.comboCounter = 0;
    this.lastAttacker = null;
    this.comboTarget = null;
    this.maxComboReached = 0;
    // ===== KONEC NOVÉHO KÓDU =====
  }

  // ===== NOVÝ KÓD: Combo calculation =====
  /**
   * Calculate combo damage multiplier
   * +10% per combo hit, max 5 combo (50% bonus)
   */
  getComboMultiplier(): number {
    const comboBonus = Math.min(this.comboCounter, 5) * 0.1;
    return 1.0 + comboBonus;
  }

  /**
   * Update combo counter
   */
  updateCombo(attacker: Combatant, target: Combatant, didHit: boolean): void {
    if (!didHit) {
      // Miss breaks combo
      this.resetCombo();
      return;
    }

    // Check if same attacker and same target
    if (this.lastAttacker?.id === attacker.id && this.comboTarget?.id === target.id) {
      this.comboCounter++;

      if (this.comboCounter > this.maxComboReached) {
        this.maxComboReached = this.comboCounter;
      }

      if (this.comboCounter >= 3) {
        this.log(`💥 ${this.comboCounter}x COMBO!`, 'skill');
      }
    } else {
      // Different attacker or target - reset combo
      this.comboCounter = 1;
      this.lastAttacker = attacker;
      this.comboTarget = target;
    }
  }

  /**
   * Reset combo (on miss or target death)
   */
  resetCombo(): void {
    if (this.comboCounter >= 3) {
      this.log(`Combo broken! (Max: ${this.comboCounter}x)`, 'info');
    }

    this.comboCounter = 0;
    this.lastAttacker = null;
    this.comboTarget = null;
  }
  // ===== KONEC NOVÉHO KÓDU =====

  /**
   * Handle character taking damage
   */
  private processAction(action: CombatActionResult): void {
    // ... existing code

    // ===== NOVÝ KÓD: Update combo =====
    if (action.type === 'basic_attack' || action.type === 'skill_damage') {
      this.updateCombo(
        action.attacker,
        action.target!,
        !action.didMiss
      );
    }
    // ===== KONEC NOVÉHO KÓDU =====

    // ... rest of processing
  }
}
```

#### 2.2 Aplikovat combo multiplier na damage

**Soubor:** `src/engine/hero/Hero.ts`

```typescript
attack(target: Combatant): CombatActionResult | null {
  if (!this.isAlive || !target.isAlive) return null;

  const combatStats = this.getCombatStats();
  const isCrit = Math.random() * 100 < combatStats.CRIT;
  let baseDamage = combatStats.ATK;

  // ===== NOVÝ KÓD: Apply combo multiplier if available =====
  // NOTE: Combo multiplier is applied in CombatEngine BEFORE this function
  // We need to pass it down, so add it to executeAttackWithAccuracy
  // ===== KONEC NOVÉHO KÓDU =====

  const hitResult = executeAttackWithAccuracy(this, target, baseDamage, isCrit);

  // ... rest of attack
}
```

#### 2.3 Update executeAttackWithAccuracy s combo

**Soubor:** `src/utils/combat/hitCalculation.ts`

```typescript
/**
 * Execute attack with combo multiplier
 */
export function executeAttackWithAccuracy(
  attacker: Combatant,
  target: Combatant,
  baseDamage: number,
  isCrit: boolean,
  comboMultiplier: number = 1.0  // NEW parameter
): HitResult {
  // ... existing hit calculation

  if (!didHit) {
    return {
      didHit: false,
      hitChance,
      wasCrit: false,
      finalDamage: 0
    };
  }

  // ===== ZMĚNA: Apply combo multiplier =====
  const comboDamage = Math.floor(baseDamage * comboMultiplier);
  const finalDamage = target.takeDamage(comboDamage, isCrit);
  // ===== KONEC ZMĚNY =====

  return {
    didHit: true,
    hitChance,
    wasCrit: isCrit,
    finalDamage,
    comboMultiplier  // NEW: Return multiplier for display
  };
}
```

#### 2.4 Vytvořit ComboCounter display komponentu

**Soubor:** `src/components/combat/ComboCounter.tsx` (NOVÝ)

```typescript
/**
 * Combo Counter Display
 * Shows current combo with animations
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComboCounterProps {
  comboCount: number;
  maxCombo: number;
}

export const ComboCounter: React.FC<ComboCounterProps> = ({
  comboCount,
  maxCombo
}) => {
  if (comboCount < 2) return null;  // Only show at 2+ combo

  // Color based on combo count
  const getColor = () => {
    if (comboCount >= 5) return '#ef4444';  // Red (max combo)
    if (comboCount >= 4) return '#f59e0b';  // Orange
    if (comboCount >= 3) return '#fbbf24';  // Yellow
    return '#3b82f6';  // Blue
  };

  const color = getColor();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      >
        <div style={{
          padding: '20px 40px',
          background: `linear-gradient(135deg, ${color}44 0%, ${color}22 100%)`,
          border: `3px solid ${color}`,
          borderRadius: '16px',
          boxShadow: `
            0 0 20px ${color}88,
            0 0 40px ${color}44
          `,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3em',
            fontWeight: 'bold',
            color: color,
            textShadow: `
              0 0 10px ${color},
              0 0 20px ${color}
            `,
            lineHeight: '1'
          }}>
            {comboCount}x
          </div>
          <div style={{
            fontSize: '1.2em',
            fontWeight: '600',
            color: '#fff',
            marginTop: '8px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
          }}>
            COMBO!
          </div>
          {comboCount >= 5 && (
            <div style={{
              fontSize: '0.9em',
              color: '#fbbf24',
              marginTop: '4px',
              fontWeight: '600'
            }}>
              MAX COMBO!
            </div>
          )}

          {/* Damage bonus indicator */}
          <div style={{
            marginTop: '12px',
            padding: '6px 12px',
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            fontSize: '0.8em',
            color: '#10b981',
            fontWeight: '600'
          }}>
            +{(comboCount * 10).toFixed(0)}% Damage
          </div>

          {/* Max combo reached */}
          {maxCombo > comboCount && (
            <div style={{
              marginTop: '6px',
              fontSize: '0.7em',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Best: {maxCombo}x
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
```

#### 2.5 Integrovat ComboCounter do Router

**Soubor:** `src/Router.tsx`

```typescript
import { ComboCounter } from './components/combat/ComboCounter';

// V combat display JSX (po combat header)
{combatActive && (inDungeon && currentDungeon || !inDungeon) && (
  <div style={{...}}>
    {/* Combat Header */}
    {/* Speed Controls */}
    {/* Initiative Bar */}

    {/* ===== NOVÝ KÓD: Combo Counter ===== */}
    <ComboCounter
      comboCount={combatEngine.comboCounter}
      maxCombo={combatEngine.maxComboReached}
    />
    {/* ===== KONEC NOVÉHO KÓDU ===== */}

    {/* Rest of combat UI */}
  </div>
)}
```

### ✅ Testing Checklist

- [ ] Combo counter se zobrazí při 2+ consecutive hits
- [ ] Combo se zvyšuje když stejný attacker hit stejný target
- [ ] Combo se resetuje při miss
- [ ] Combo se resetuje když target umře
- [ ] Combo damage bonus se aplikuje (+10% per combo)
- [ ] Max combo je 5x (50% bonus)
- [ ] ComboCounter animace funguje
- [ ] Barva se mění podle combo (blue→yellow→orange→red)
- [ ] "MAX COMBO!" se zobrazí at 5x
- [ ] Best combo se trackuje

---

**(Kvůli délce ukončuji PHASE 3 zde - zbylé steps 3-5 vytvořím v PHASE 3.5)**

### Pokračování

Steps 3-5 (Resource System, Counter-Attacks, Enhanced AI) budou v **PHASE_3.5_ADVANCED_CONTINUED.md**.

Chceš pokračovat teď, nebo mám vytvořit PHASE 4 a 5?
