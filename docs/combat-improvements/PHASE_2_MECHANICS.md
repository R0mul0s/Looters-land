# ⚔️ PHASE 2: Combat Mechanics Depth ✅ COMPLETED

> **Přidání tactical depth do core combat systému**
>
> ⏱️ Odhadovaný čas: 12-16 hodin
> 🔴 Priorita: HIGH
> 📦 Závislosti: PHASE 1 (tooltips pro zobrazení resistances)
n> ✅ **STAV: HOTOVO** (2025-11-21)

---

## 📋 Obsah PHASE 2

1. [Accuracy/Evasion System](#step-1-accuracyevasion-system) - 2-3h
2. [Elemental Damage Types](#step-2-elemental-damage-types) - 3-4h
3. [Damage Number Animations](#step-3-damage-number-animations) - 2-3h
4. [Status Effect Visual Indicators](#step-4-status-effect-visual-indicators) - 2-3h
5. [Enhanced Combat Log](#step-5-enhanced-combat-log) - 2-3h

---

## 🎯 STEP 1: Accuracy/Evasion System

### Cíl
Přidat hit chance mechaniku - ne všechny útoky již budou trefit (100% hit rate → dynamic).

### Implementace

#### 1.1 Přidat ACC/EVA do Combatant interface

**Soubor:** `src/types/combat.types.ts`

```typescript
// Update existujícího Combatant typu (nejde přímo upravit Hero/Enemy, protože jsou classes)
// Místo toho přidáme helper funkce

/**
 * Extended combat stats with accuracy and evasion
 */
export interface ExtendedCombatStats {
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
  ACC: number;  // NEW: Accuracy rating (base 100)
  EVA: number;  // NEW: Evasion rating (base 0)
}

/**
 * Hit calculation result
 */
export interface HitResult {
  didHit: boolean;
  hitChance: number;  // Percentage (0-100)
  wasCrit: boolean;
  finalDamage: number;
}
```

#### 1.2 Přidat ACC/EVA do Hero class

**Soubor:** `src/engine/hero/Hero.ts`

```typescript
export class Hero {
  // Existing stats...
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;

  // ===== NOVÝ KÓD: Accuracy/Evasion =====
  ACC: number;  // Accuracy rating
  EVA: number;  // Evasion rating
  // ===== KONEC NOVÉHO KÓDU =====

  constructor(params: HeroParams) {
    // ... existing initialization

    // ===== NOVÝ KÓD: Initialize ACC/EVA =====
    // Accuracy scales with level + DEX stat (if you have it)
    // For now, base it on SPD (faster = more accurate)
    this.ACC = 100 + Math.floor(this.SPD * 0.5);  // Base 100 + SPD bonus

    // Evasion also scales with SPD
    this.EVA = Math.floor(this.SPD * 0.3);  // 0 + SPD bonus
    // ===== KONEC NOVÉHO KÓDU =====
  }

  // ===== NOVÝ KÓD: Metoda pro získání extended stats =====
  getExtendedCombatStats(): ExtendedCombatStats {
    return {
      ATK: this.getEffectiveStat(this.ATK, 'ATK'),
      DEF: this.getEffectiveStat(this.DEF, 'DEF'),
      SPD: this.getEffectiveStat(this.SPD, 'SPD'),
      CRIT: this.getEffectiveStat(this.CRIT, 'CRIT'),
      ACC: this.ACC,  // TODO: Apply status effect modifiers
      EVA: this.EVA   // TODO: Apply status effect modifiers
    };
  }
  // ===== KONEC NOVÉHO KÓDU =====
}
```

#### 1.3 Přidat ACC/EVA do Enemy class

**Soubor:** `src/engine/combat/Enemy.ts`

```typescript
export class Enemy {
  // Existing stats...
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;

  // ===== NOVÝ KÓD =====
  ACC: number;
  EVA: number;
  // ===== KONEC NOVÉHO KÓDU =====

  constructor(name: string, level: number = 1, type: EnemyType = 'normal') {
    // ... existing initialization

    // ===== NOVÝ KÓD: Initialize after stats are calculated =====
    // Enemies have slightly lower accuracy than heroes
    this.ACC = 90 + Math.floor(this.SPD * 0.4);
    this.EVA = Math.floor(this.SPD * 0.25);

    // Bosses get accuracy/evasion bonuses
    if (this.type === 'boss') {
      this.ACC += 20;
      this.EVA += 15;
    } else if (this.type === 'elite') {
      this.ACC += 10;
      this.EVA += 8;
    }
    // ===== KONEC NOVÉHO KÓDU =====
  }

  // ===== NOVÝ KÓD =====
  getExtendedCombatStats(): ExtendedCombatStats {
    return {
      ATK: this.getCombatStats().ATK,
      DEF: this.getCombatStats().DEF,
      SPD: this.getCombatStats().SPD,
      CRIT: this.getCombatStats().CRIT,
      ACC: this.ACC,
      EVA: this.EVA
    };
  }
  // ===== KONEC NOVÉHO KÓDU =====
}
```

#### 1.4 Vytvořit Hit Calculation Utility

**Soubor:** `src/utils/combat/hitCalculation.ts` (NOVÝ)

```typescript
/**
 * Hit Calculation Utilities
 * Handles accuracy, evasion, and hit chance calculations
 */

import type { Combatant } from '../../types/combat.types';
import type { HitResult } from '../../types/combat.types';

/**
 * Calculate hit chance based on attacker ACC and target EVA
 *
 * Formula: 100 + (ACC - EVA) / 10
 * - Min 5% hit chance (always a chance to hit)
 * - Max 95% hit chance (always a chance to miss)
 *
 * Examples:
 * - ACC 100, EVA 0: 100 + (100-0)/10 = 110 → capped at 95%
 * - ACC 100, EVA 50: 100 + (100-50)/10 = 105 → capped at 95%
 * - ACC 80, EVA 100: 100 + (80-100)/10 = 98%
 * - ACC 50, EVA 150: 100 + (50-150)/10 = 90% → capped at 5%
 */
export function calculateHitChance(attackerACC: number, targetEVA: number): number {
  const rawChance = 100 + (attackerACC - targetEVA) / 10;

  // Cap between 5% and 95%
  return Math.max(5, Math.min(95, rawChance));
}

/**
 * Roll for hit/miss
 */
export function rollHit(attackerACC: number, targetEVA: number): boolean {
  const hitChance = calculateHitChance(attackerACC, targetEVA);
  const roll = Math.random() * 100;

  return roll < hitChance;
}

/**
 * Execute attack with hit calculation
 */
export function executeAttackWithAccuracy(
  attacker: Combatant,
  target: Combatant,
  baseDamage: number,
  isCrit: boolean
): HitResult {
  // Get accuracy and evasion
  const attackerStats = 'getExtendedCombatStats' in attacker
    ? attacker.getExtendedCombatStats()
    : { ACC: 100, EVA: 0, ATK: attacker.ATK, DEF: attacker.DEF, SPD: attacker.SPD, CRIT: attacker.CRIT };

  const targetStats = 'getExtendedCombatStats' in target
    ? target.getExtendedCombatStats()
    : { ACC: 100, EVA: 0, ATK: target.ATK, DEF: target.DEF, SPD: target.SPD, CRIT: target.CRIT };

  const hitChance = calculateHitChance(attackerStats.ACC, targetStats.EVA);
  const didHit = rollHit(attackerStats.ACC, targetStats.EVA);

  if (!didHit) {
    // Miss!
    return {
      didHit: false,
      hitChance,
      wasCrit: false,
      finalDamage: 0
    };
  }

  // Hit! Calculate damage
  const finalDamage = target.takeDamage(baseDamage, isCrit);

  return {
    didHit: true,
    hitChance,
    wasCrit: isCrit,
    finalDamage
  };
}
```

#### 1.5 Update attack methods v Hero.ts

**Soubor:** `src/engine/hero/Hero.ts`

```typescript
import { executeAttackWithAccuracy } from '../../utils/combat/hitCalculation';

export class Hero {
  // ...

  /**
   * Basic attack
   */
  attack(target: Combatant): CombatActionResult | null {
    if (!this.isAlive || !target.isAlive) return null;

    const combatStats = this.getCombatStats();
    const isCrit = Math.random() * 100 < combatStats.CRIT;
    const baseDamage = combatStats.ATK;

    // ===== ZMĚNA: Use new accuracy system =====
    const hitResult = executeAttackWithAccuracy(this, target, baseDamage, isCrit);

    return {
      attacker: this,
      target: target,
      damage: hitResult.finalDamage,
      isCrit: hitResult.wasCrit,
      didMiss: !hitResult.didHit,  // NEW: Track misses
      hitChance: hitResult.hitChance,  // NEW: Track hit chance
      type: 'basic_attack'
    };
    // ===== KONEC ZMĚNY =====
  }
}
```

#### 1.6 Update attack v Enemy.ts

**Soubor:** `src/engine/combat/Enemy.ts`

```typescript
import { executeAttackWithAccuracy } from '../../utils/combat/hitCalculation';

export class Enemy {
  // ...

  attack(target: Combatant): CombatActionResult | null {
    if (!this.isAlive || !target.isAlive) return null;

    const combatStats = this.getCombatStats();
    const isCrit = Math.random() * 100 < combatStats.CRIT;
    const baseDamage = combatStats.ATK;

    // ===== ZMĚNA: Use accuracy system =====
    const hitResult = executeAttackWithAccuracy(this, target, baseDamage, isCrit);

    return {
      attacker: this,
      target: target,
      damage: hitResult.finalDamage,
      isCrit: hitResult.wasCrit,
      didMiss: !hitResult.didHit,
      hitChance: hitResult.hitChance,
      type: 'basic_attack'
    };
    // ===== KONEC ZMĚNY =====
  }
}
```

#### 1.7 Update CombatActionResult type

**Soubor:** `src/types/combat.types.ts`

```typescript
export interface CombatActionResult {
  attacker: Combatant;
  target?: Combatant;
  targets?: Combatant[];
  damage?: number;
  isCrit?: boolean;
  didMiss?: boolean;      // NEW
  hitChance?: number;     // NEW
  healAmount?: number;
  skillName?: string;
  type: CombatActionType;
  effect?: string;
  results?: Array<{
    target: Combatant;
    damage?: number;
    isCrit?: boolean;
    didMiss?: boolean;    // NEW
    healAmount?: number;
  }>;
}
```

#### 1.8 Update combat log processing v CombatEngine.ts

**Soubor:** `src/engine/combat/CombatEngine.ts`

```typescript
private processAction(action: CombatActionResult): void {
  if (!action) return;

  const attacker = action.attacker;

  switch (action.type) {
    case 'basic_attack': {
      // ===== ZMĚNA: Handle misses =====
      if (action.didMiss) {
        this.log(
          `${attacker.name} attacks ${action.target?.name} but MISSES! (${action.hitChance?.toFixed(1)}% hit chance)`,
          'attack'
        );
        break;
      }
      // ===== KONEC ZMĚNY =====

      const critText = action.isCrit ? ' [CRIT!]' : '';
      this.log(
        `${attacker.name} attacks ${action.target?.name} for ${action.damage} damage${critText}`,
        'attack'
      );
      if (action.target && !action.target.isAlive) {
        this.log(`${action.target.name} has been defeated!`, 'death');
      }
      break;
    }

    case 'skill_damage': {
      // ===== ZMĚNA: Handle skill misses =====
      if (action.didMiss) {
        this.log(
          `${attacker.name} uses ${action.skillName} on ${action.target?.name} but MISSES!`,
          'skill'
        );
        break;
      }
      // ===== KONEC ZMĚNY =====

      const skillCritText = action.isCrit ? ' [CRIT!]' : '';
      this.log(
        `${attacker.name} uses ${action.skillName} on ${action.target?.name} for ${action.damage} damage${skillCritText}`,
        'skill'
      );
      // ... rest of cases
    }

    case 'skill_aoe':
      this.log(`${attacker.name} uses ${action.skillName} on all targets!`, 'skill');
      action.results?.forEach(result => {
        // ===== ZMĚNA: Handle AOE misses =====
        if (result.didMiss) {
          this.log(`  → ${result.target.name} evades the attack!`, 'skill');
          return;
        }
        // ===== KONEC ZMĚNY =====

        const critText = result.isCrit ? ' [CRIT!]' : '';
        this.log(`  → ${result.target.name} takes ${result.damage} damage${critText}`, 'skill');
        if (!result.target.isAlive) {
          this.log(`  → ${result.target.name} has been defeated!`, 'death');
        }
      });
      break;

    // ... rest of cases
  }
}
```

#### 1.9 Update EnemyTooltip pro zobrazení ACC/EVA

**Soubor:** `src/components/combat/EnemyTooltip.tsx`

```typescript
export const EnemyTooltipContent: React.FC<EnemyTooltipProps> = ({ enemy }) => {
  // ... existing code

  // ===== NOVÝ KÓD: Get extended stats =====
  const extendedStats = enemy.getExtendedCombatStats();
  // ===== KONEC NOVÉHO KÓDU =====

  return (
    <div>
      {/* ... existing tooltip content ... */}

      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '8px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        {/* ... existing stats ... */}

        {/* ===== NOVÝ KÓD: ACC/EVA stats ===== */}
        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75em' }}>
            🎯 ACC
          </div>
          <div style={{ color: '#8b5cf6', fontWeight: '600', fontSize: '1.1em' }}>
            {extendedStats.ACC}
          </div>
        </div>

        <div>
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75em' }}>
            💨 EVA
          </div>
          <div style={{ color: '#06b6d4', fontWeight: '600', fontSize: '1.1em' }}>
            {extendedStats.EVA}
          </div>
        </div>
        {/* ===== KONEC NOVÉHO KÓDU ===== */}
      </div>

      {/* ... rest of tooltip ... */}
    </div>
  );
};
```

### ✅ Testing Checklist

- [ ] ACC/EVA se správně inicializují pro heroes
- [ ] ACC/EVA se správně inicializují pro enemies (včetně boss/elite bonusů)
- [ ] Útoky mohou missovat (vidět "MISSES!" v combat logu)
- [ ] Hit chance je mezi 5-95%
- [ ] Vysoký EVA cíle snižuje hit chance
- [ ] Vysoký ACC útočníka zvyšuje hit chance
- [ ] Skills také mohou missovat
- [ ] AOE skills mají independent hit rolls pro každý target
- [ ] Enemy tooltip zobrazuje ACC/EVA
- [ ] Combat log zobrazuje hit chance u missů

---

## 🎯 STEP 2: Elemental Damage Types

### Cíl
Přidat 6 elementů (Physical, Fire, Ice, Lightning, Holy, Dark) s resistances a weaknesses.

### Implementace

#### 2.1 Definovat Element types

**Soubor:** `src/types/combat.types.ts`

```typescript
/**
 * Elemental damage types
 */
export type Element = 'physical' | 'fire' | 'ice' | 'lightning' | 'holy' | 'dark';

/**
 * Element resistances (0-100%)
 */
export type ElementResistances = Record<Element, number>;

/**
 * Element info for UI
 */
export interface ElementInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Element database
 */
export const ELEMENTS: Record<Element, ElementInfo> = {
  physical: {
    name: 'Physical',
    icon: '⚔️',
    color: '#9ca3af',
    description: 'Standard physical damage'
  },
  fire: {
    name: 'Fire',
    icon: '🔥',
    color: '#ef4444',
    description: 'Burns enemies with flames'
  },
  ice: {
    name: 'Ice',
    icon: '❄️',
    color: '#3b82f6',
    description: 'Freezes enemies with cold'
  },
  lightning: {
    name: 'Lightning',
    icon: '⚡',
    color: '#fbbf24',
    description: 'Strikes with electricity'
  },
  holy: {
    name: 'Holy',
    icon: '✨',
    color: '#fde047',
    description: 'Divine light damage'
  },
  dark: {
    name: 'Dark',
    icon: '🌑',
    color: '#7c3aed',
    description: 'Shadow and curse damage'
  }
};
```

#### 2.2 Přidat resistances do Hero

**Soubor:** `src/engine/hero/Hero.ts`

```typescript
import type { Element, ElementResistances } from '../../types/combat.types';

export class Hero {
  // ... existing properties

  // ===== NOVÝ KÓD: Elemental properties =====
  resistances: ElementResistances;
  weaknesses: Element[];
  // ===== KONEC NOVÉHO KÓDU =====

  constructor(params: HeroParams) {
    // ... existing initialization

    // ===== NOVÝ KÓD: Initialize resistances based on class =====
    this.resistances = this.initializeResistances(params.class);
    this.weaknesses = this.initializeWeaknesses(params.class);
    // ===== KONEC NOVÉHO KÓDU =====
  }

  // ===== NOVÝ KÓD: Class-based resistance initialization =====
  private initializeResistances(heroClass: string): ElementResistances {
    const baseResistances: ElementResistances = {
      physical: 0,
      fire: 0,
      ice: 0,
      lightning: 0,
      holy: 0,
      dark: 0
    };

    // Class-specific resistances
    switch (heroClass) {
      case 'warrior':
        baseResistances.physical = 20;  // 20% physical resistance
        break;
      case 'mage':
        baseResistances.fire = 15;
        baseResistances.ice = 15;
        baseResistances.lightning = 15;
        break;
      case 'cleric':
        baseResistances.holy = 30;
        baseResistances.dark = -20;  // Weak to dark (negative = extra damage)
        break;
      case 'rogue':
        // Rogues have no special resistances but high evasion
        break;
    }

    return baseResistances;
  }

  private initializeWeaknesses(heroClass: string): Element[] {
    // Weaknesses grant 2x damage
    switch (heroClass) {
      case 'warrior':
        return ['lightning'];  // Heavy armor conducts electricity
      case 'mage':
        return ['physical'];   // Frail, weak to physical attacks
      case 'cleric':
        return ['dark'];       // Holy warriors weak to darkness
      case 'rogue':
        return [];             // No specific weakness
      default:
        return [];
    }
  }
  // ===== KONEC NOVÉHO KÓDU =====
}
```

#### 2.3 Přidat resistances do Enemy

**Soubor:** `src/engine/combat/Enemy.ts`

```typescript
import type { Element, ElementResistances } from '../../types/combat.types';

export class Enemy {
  // ... existing properties

  // ===== NOVÝ KÓD =====
  resistances: ElementResistances;
  weaknesses: Element[];
  // ===== KONEC NOVÉHO KÓDU =====

  constructor(name: string, level: number = 1, type: EnemyType = 'normal') {
    // ... existing initialization

    // ===== NOVÝ KÓD: Random resistances based on enemy name =====
    this.resistances = this.generateResistances(name);
    this.weaknesses = this.generateWeaknesses(name);
    // ===== KONEC NOVÉHO KÓDU =====
  }

  // ===== NOVÝ KÓD: Name-based resistance generation =====
  private generateResistances(name: string): ElementResistances {
    const baseResistances: ElementResistances = {
      physical: 0,
      fire: 0,
      ice: 0,
      lightning: 0,
      holy: 0,
      dark: 0
    };

    // Pattern matching on enemy name for thematic resistances
    const nameLower = name.toLowerCase();

    if (nameLower.includes('skeleton') || nameLower.includes('zombie')) {
      baseResistances.physical = 15;
      baseResistances.dark = 30;
      baseResistances.holy = -30;  // Weak to holy
    } else if (nameLower.includes('goblin') || nameLower.includes('orc')) {
      baseResistances.physical = 10;
    } else if (nameLower.includes('imp') || nameLower.includes('demon')) {
      baseResistances.fire = 40;
      baseResistances.dark = 25;
      baseResistances.holy = -25;
    } else if (nameLower.includes('spider')) {
      baseResistances.physical = 5;
      baseResistances.fire = -20;  // Spiders burn easily
    } else if (nameLower.includes('wolf')) {
      baseResistances.physical = 15;
      baseResistances.ice = 10;   // Fur protects from cold
    } else if (nameLower.includes('slime')) {
      baseResistances.physical = 30;  // Squishy, physical attacks ineffective
      baseResistances.fire = -30;
      baseResistances.lightning = -30;
    }

    return baseResistances;
  }

  private generateWeaknesses(name: string): Element[] {
    const nameLower = name.toLowerCase();
    const weaknesses: Element[] = [];

    if (nameLower.includes('skeleton') || nameLower.includes('zombie')) {
      weaknesses.push('holy', 'fire');
    } else if (nameLower.includes('imp') || nameLower.includes('demon')) {
      weaknesses.push('holy');
    } else if (nameLower.includes('spider')) {
      weaknesses.push('fire');
    } else if (nameLower.includes('slime')) {
      weaknesses.push('fire', 'lightning');
    }

    return weaknesses;
  }
  // ===== KONEC NOVÉHO KÓDU =====
}
```

#### 2.4 Update Skill type pro elements

**Soubor:** `src/types/hero.types.ts`

```typescript
import type { Element } from './combat.types';

export interface Skill {
  name: string;
  description: string;
  type: SkillType;
  cooldown: number;
  element?: Element;  // NEW: Elemental type of skill
  execute: SkillExecuteFunction;
}
```

#### 2.5 Vytvořit Elemental Damage Calculator

**Soubor:** `src/utils/combat/elementalDamage.ts` (NOVÝ)

```typescript
/**
 * Elemental Damage Calculation Utilities
 */

import type { Combatant } from '../../types/combat.types';
import type { Element, ElementResistances } from '../../types/combat.types';

/**
 * Calculate elemental damage multiplier
 *
 * Formula:
 * - If target has weakness: 2.0x damage
 * - Otherwise: (100 - resistance%) / 100
 *
 * Examples:
 * - Fire attack vs Fire resistance 30%: 0.7x damage
 * - Holy attack vs Undead (weakness): 2.0x damage
 * - Physical attack vs 0% resistance: 1.0x damage
 */
export function calculateElementalMultiplier(
  element: Element,
  target: Combatant
): number {
  // Check if target has this element in weaknesses
  if ('weaknesses' in target && target.weaknesses.includes(element)) {
    return 2.0;  // Double damage on weakness
  }

  // Get resistance value
  const resistance = 'resistances' in target
    ? target.resistances[element]
    : 0;

  // Negative resistance = extra damage
  // Positive resistance = reduced damage
  const multiplier = (100 - resistance) / 100;

  // Cap at 0.1x minimum (90% resistance max) and 3.0x maximum
  return Math.max(0.1, Math.min(3.0, multiplier));
}

/**
 * Apply elemental damage to target
 */
export function applyElementalDamage(
  baseDamage: number,
  element: Element,
  target: Combatant,
  isCrit: boolean
): { finalDamage: number; multiplier: number; wasWeakness: boolean } {
  const elementalMultiplier = calculateElementalMultiplier(element, target);
  const scaledDamage = Math.floor(baseDamage * elementalMultiplier);

  const finalDamage = target.takeDamage(scaledDamage, isCrit);

  const wasWeakness = 'weaknesses' in target && target.weaknesses.includes(element);

  return {
    finalDamage,
    multiplier: elementalMultiplier,
    wasWeakness
  };
}

/**
 * Get resistance display text
 */
export function getResistanceText(resistance: number): string {
  if (resistance > 50) return 'Strong Resist';
  if (resistance > 25) return 'Resist';
  if (resistance > 0) return 'Weak Resist';
  if (resistance === 0) return 'Neutral';
  if (resistance > -25) return 'Weak';
  return 'Very Weak';
}
```

#### 2.6 Update attack methods pro elemental damage

**Soubor:** `src/engine/hero/Hero.ts`

```typescript
import { applyElementalDamage } from '../../utils/combat/elementalDamage';

export class Hero {
  // ...

  attack(target: Combatant): CombatActionResult | null {
    if (!this.isAlive || !target.isAlive) return null;

    const combatStats = this.getCombatStats();
    const isCrit = Math.random() * 100 < combatStats.CRIT;
    const baseDamage = combatStats.ATK;

    const hitResult = executeAttackWithAccuracy(this, target, baseDamage, isCrit);

    if (!hitResult.didHit) {
      return {
        attacker: this,
        target: target,
        damage: 0,
        isCrit: false,
        didMiss: true,
        hitChance: hitResult.hitChance,
        type: 'basic_attack'
      };
    }

    // ===== ZMĚNA: Apply elemental damage (basic attacks are physical) =====
    const elementalResult = applyElementalDamage(
      baseDamage,
      'physical',
      target,
      isCrit
    );

    return {
      attacker: this,
      target: target,
      damage: elementalResult.finalDamage,
      isCrit: hitResult.wasCrit,
      didMiss: false,
      hitChance: hitResult.hitChance,
      element: 'physical',  // NEW
      elementalMultiplier: elementalResult.multiplier,  // NEW
      wasWeakness: elementalResult.wasWeakness,  // NEW
      type: 'basic_attack'
    };
    // ===== KONEC ZMĚNY =====
  }

  // Update všech skill execute funkcí podobně
  // Example pro Fireball skill:
  // const elementalResult = applyElementalDamage(damage, 'fire', target, isCrit);
}
```

#### 2.7 Update CombatActionResult type

**Soubor:** `src/types/combat.types.ts`

```typescript
export interface CombatActionResult {
  // ... existing fields
  element?: Element;              // NEW
  elementalMultiplier?: number;   // NEW
  wasWeakness?: boolean;          // NEW
  // ... rest of fields
}
```

#### 2.8 Update combat log pro elemental info

**Soubor:** `src/engine/combat/CombatEngine.ts`

```typescript
private processAction(action: CombatActionResult): void {
  // ...

  case 'basic_attack': {
    if (action.didMiss) {
      // ... miss handling
    }

    const critText = action.isCrit ? ' [CRIT!]' : '';
    // ===== ZMĚNA: Add elemental info =====
    const weaknessText = action.wasWeakness ? ' [WEAKNESS!]' : '';
    const elementText = action.element && action.element !== 'physical'
      ? ` (${action.element})`
      : '';

    this.log(
      `${attacker.name} attacks ${action.target?.name} for ${action.damage} damage${elementText}${critText}${weaknessText}`,
      'attack'
    );
    // ===== KONEC ZMĚNY =====

    if (action.target && !action.target.isAlive) {
      this.log(`${action.target.name} has been defeated!`, 'death');
    }
    break;
  }

  // Podobné změny pro skill_damage, skill_aoe, etc.
}
```

#### 2.9 Vytvořit Resistance Display Component

**Soubor:** `src/components/combat/ResistanceDisplay.tsx` (NOVÝ)

```typescript
/**
 * Resistance Display Component
 * Shows elemental resistances/weaknesses for a character
 */
import React from 'react';
import type { Element, ElementResistances } from '../../types/combat.types';
import { ELEMENTS } from '../../types/combat.types';
import { getResistanceText } from '../../utils/combat/elementalDamage';

interface ResistanceDisplayProps {
  resistances: ElementResistances;
  weaknesses: Element[];
  compact?: boolean;
}

export const ResistanceDisplay: React.FC<ResistanceDisplayProps> = ({
  resistances,
  weaknesses,
  compact = false
}) => {
  const elements: Element[] = ['physical', 'fire', 'ice', 'lightning', 'holy', 'dark'];

  if (compact) {
    // Show only non-zero resistances and weaknesses
    const relevantElements = elements.filter(el =>
      resistances[el] !== 0 || weaknesses.includes(el)
    );

    if (relevantElements.length === 0) {
      return <div style={styles.compactEmpty}>No special resistances</div>;
    }

    return (
      <div style={styles.compactContainer}>
        {relevantElements.map(element => {
          const info = ELEMENTS[element];
          const resistance = resistances[element];
          const isWeakness = weaknesses.includes(element);

          return (
            <div
              key={element}
              style={{
                ...styles.compactBadge,
                background: isWeakness
                  ? 'rgba(239, 68, 68, 0.2)'
                  : resistance > 0
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(59, 130, 246, 0.2)',
                borderColor: info.color
              }}
            >
              <span style={{ fontSize: '1.2em' }}>{info.icon}</span>
              <span style={{ fontSize: '0.75em', color: info.color }}>
                {isWeakness ? '2x' : `${resistance > 0 ? '+' : ''}${resistance}%`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full display
  return (
    <div style={styles.fullContainer}>
      {elements.map(element => {
        const info = ELEMENTS[element];
        const resistance = resistances[element];
        const isWeakness = weaknesses.includes(element);

        return (
          <div key={element} style={styles.fullRow}>
            <div style={styles.elementLabel}>
              <span style={{ fontSize: '1.2em', marginRight: '4px' }}>{info.icon}</span>
              <span style={{ color: info.color, fontSize: '0.85em' }}>
                {info.name}
              </span>
            </div>

            <div style={{
              ...styles.resistanceBar,
              background: isWeakness
                ? 'linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.3) 100%)'
                : resistance > 0
                ? `linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.3) ${resistance}%)`
                : 'rgba(255, 255, 255, 0.05)'
            }}>
              <span style={styles.resistanceText}>
                {isWeakness ? 'WEAKNESS (2x)' : getResistanceText(resistance)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  compactContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  compactEmpty: {
    fontSize: '0.75em',
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic'
  },
  compactBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '0.8em'
  },
  fullContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  fullRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  elementLabel: {
    minWidth: '90px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85em'
  },
  resistanceBar: {
    flex: 1,
    height: '20px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  resistanceText: {
    position: 'relative',
    zIndex: 1,
    fontSize: '0.7em',
    fontWeight: '600',
    color: '#fff',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
  }
};
```

#### 2.10 Přidat resistances do EnemyTooltip

**Soubor:** `src/components/combat/EnemyTooltip.tsx`

```typescript
import { ResistanceDisplay } from './ResistanceDisplay';

export const EnemyTooltipContent: React.FC<EnemyTooltipProps> = ({ enemy }) => {
  // ... existing code

  return (
    <div>
      {/* ... existing tooltip sections ... */}

      {/* ===== NOVÝ KÓD: Elemental Resistances ===== */}
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          fontSize: '0.8em',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Elemental Resistances:
        </div>
        <ResistanceDisplay
          resistances={enemy.resistances}
          weaknesses={enemy.weaknesses}
          compact={true}
        />
      </div>
      {/* ===== KONEC NOVÉHO KÓDU ===== */}

      {/* ... rest of tooltip ... */}
    </div>
  );
};
```

### ✅ Testing Checklist

- [ ] Heroes mají class-specific resistances
- [ ] Enemies mají name-based resistances (Skeleton weak to Holy, etc.)
- [ ] Weakness attacks deal 2x damage
- [ ] High resistance reduces damage correctly
- [ ] Negative resistance increases damage
- [ ] Combat log shows [WEAKNESS!] tag
- [ ] Combat log shows element type (fire), (ice), etc.
- [ ] Enemy tooltip zobrazuje resistances compactly
- [ ] ResistanceDisplay funguje v compact i full módu
- [ ] Physical element je default pro basic attacks

---

## 🎯 STEP 3: Damage Number Animations

**(Pokračování v dalším souboru kvůli délce...)**

### Cíl
Zobrazit animované floating damage numbers nad postavami.

### Implementace

#### 3.1 Install framer-motion (pokud ještě není)

```bash
npm install framer-motion
```

#### 3.2 Vytvořit DamageNumber komponentu

**Soubor:** `src/components/combat/DamageNumber.tsx` (NOVÝ)

```typescript
/**
 * Animated Damage Number Component
 * Floats up and fades out above damaged character
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DamageNumberProps {
  damage: number;
  isCrit: boolean;
  didMiss: boolean;
  wasWeakness: boolean;
  element?: string;
  isHeal?: boolean;
  targetId: string;  // Character ID to position above
}

export const DamageNumber: React.FC<DamageNumberProps> = ({
  damage,
  isCrit,
  didMiss,
  wasWeakness,
  element,
  isHeal = false,
  targetId
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Determine color based on type
  const getColor = () => {
    if (didMiss) return '#9ca3af';
    if (isHeal) return '#10b981';
    if (isCrit) return '#fbbf24';
    if (wasWeakness) return '#ef4444';
    return '#fff';
  };

  // Determine text
  const getText = () => {
    if (didMiss) return 'MISS!';
    if (isHeal) return `+${damage}`;
    return `-${damage}`;
  };

  // Random horizontal offset for multiple numbers
  const randomX = (Math.random() - 0.5) * 40;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 1,
            y: 0,
            x: randomX,
            scale: isCrit || wasWeakness ? 1.5 : 1
          }}
          animate={{
            opacity: 0,
            y: -80,
            x: randomX,
            scale: 1
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 1000,
            fontSize: isCrit || wasWeakness ? '2.5em' : '1.8em',
            fontWeight: 'bold',
            color: getColor(),
            textShadow: `
              0 0 10px ${getColor()},
              0 0 20px ${getColor()},
              2px 2px 4px rgba(0, 0, 0, 0.8)
            `,
            userSelect: 'none'
          }}
        >
          {getText()}
          {isCrit && <span style={{ fontSize: '0.5em', marginLeft: '4px' }}>CRIT!</span>}
          {wasWeakness && <span style={{ fontSize: '0.5em', marginLeft: '4px' }}>WEAK!</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

#### 3.3 Přidat DamageNumber tracking do Router

**Soubor:** `src/Router.tsx`

```typescript
// Import
import { DamageNumber } from './components/combat/DamageNumber';

// State pro tracking damage numbers (cca řádek 85)
interface DamageNumberData {
  id: string;
  damage: number;
  isCrit: boolean;
  didMiss: boolean;
  wasWeakness: boolean;
  element?: string;
  isHeal?: boolean;
  targetId: string;
  timestamp: number;
}

const [damageNumbers, setDamageNumbers] = useState<DamageNumberData[]>([]);

// Setup callback pro damage numbers (v useEffect nebo při combat init)
useEffect(() => {
  if (!combatActive) return;

  // Set callback na combat engine
  combatEngine.onAction = (action) => {
    // Create damage number
    if (action.target && (action.damage !== undefined || action.didMiss)) {
      const newDamageNumber: DamageNumberData = {
        id: `${Date.now()}-${Math.random()}`,
        damage: action.damage || 0,
        isCrit: action.isCrit || false,
        didMiss: action.didMiss || false,
        wasWeakness: action.wasWeakness || false,
        element: action.element,
        isHeal: action.type === 'skill_heal' || action.type === 'skill_group_heal',
        targetId: action.target.id,
        timestamp: Date.now()
      };

      setDamageNumbers(prev => [...prev, newDamageNumber]);

      // Auto-cleanup after 2 seconds
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== newDamageNumber.id));
      }, 2000);
    }

    // Handle AOE damage numbers
    if (action.results) {
      action.results.forEach(result => {
        const newDamageNumber: DamageNumberData = {
          id: `${Date.now()}-${Math.random()}`,
          damage: result.damage || 0,
          isCrit: result.isCrit || false,
          didMiss: result.didMiss || false,
          wasWeakness: false,
          targetId: result.target.id,
          timestamp: Date.now()
        };

        setDamageNumbers(prev => [...prev, newDamageNumber]);

        setTimeout(() => {
          setDamageNumbers(prev => prev.filter(d => d.id !== newDamageNumber.id));
        }, 2000);
      });
    }
  };
}, [combatActive]);

// V hero/enemy card JSX - přidat position: relative a render damage numbers
{(gameState.activeParty || []).map((hero) => {
  // ... existing code

  return (
    <div
      key={hero.id}
      style={{
        ...existingStyles,
        position: 'relative'  // IMPORTANT for absolute positioning
      }}
    >
      {/* Existing hero card content */}

      {/* ===== NOVÝ KÓD: Render damage numbers for this hero ===== */}
      {damageNumbers
        .filter(dn => dn.targetId === hero.id)
        .map(dn => (
          <DamageNumber key={dn.id} {...dn} />
        ))}
      {/* ===== KONEC NOVÉHO KÓDU ===== */}
    </div>
  );
})}

// Stejné pro enemies
```

### ✅ Testing Checklist

- [ ] Damage numbers se zobrazují nad targetem
- [ ] Miss zobrazuje "MISS!" šedě
- [ ] Crit damage je větší a žlutý
- [ ] Weakness damage má "WEAK!" tag a je červený
- [ ] Heal numbers jsou zelené s "+"
- [ ] Numbers floatují nahoru a fade out
- [ ] Multiple numbers mají random horizontal offset (nepřekrývají se)
- [ ] Numbers zmizí po 1.5s
- [ ] Performance je OK (žádné lagy)

---

**(Zkráceno kvůli délce - pokračování v dalších steps...)**

### Zbytek PHASE 2 bude pokračovat v dalším souboru. Chceš pokračovat teď, nebo mám vytvořit i zbylé PHASE 3-5?
