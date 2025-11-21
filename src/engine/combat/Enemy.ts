/**
 * Enemy System - Combat opponents
 *
 * Defines enemy characters with stats, level scaling, and AI behavior.
 * Enemies have different types (normal, elite, boss) with stat multipliers.
 *
 * Contains:
 * - Enemy class - Enemy character with stats and combat actions
 * - Enemy type system (normal, elite, boss)
 * - Level-based stat scaling
 * - Simple AI for target selection
 * - Status effects system (buffs/debuffs with duration tracking)
 * - Stat modifiers from active effects
 * - Immunity and damage reduction mechanics
 * - Enemy generation utilities
 * - Predefined enemy names pool
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-20
 */

import type {
  EnemyType,
  EnemyInfo,
  EnemyTypeMultipliers,
  CombatActionResult,
  Combatant,
  Element,
  ElementResistances
} from '../../types/combat.types';
import type { StatusEffect } from '../../types/hero.types';
import { Position, POSITION_BONUSES, type PositionBonuses } from '../../types/combat.types';

export class Enemy {
  id: string;
  name: string;
  level: number;
  type: EnemyType;
  isEnemy: boolean = true;

  // Stats
  maxHP: number;
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;
  ACC: number;  // Accuracy rating (determines hit chance)
  EVA: number;  // Evasion rating (determines dodge chance)

  // Combat state
  currentHP: number;
  isAlive: boolean;
  initiative: number;
  statusEffects: StatusEffect[];

  // Elemental properties
  resistances: ElementResistances;
  weaknesses: Element[];
// Position system (Phase 3)  position: Position;

  constructor(name: string, level: number = 1, type: EnemyType = 'normal') {
    this.id = `enemy_${Date.now()}_${Math.random()}`;
    this.name = name;
    this.level = level;
    this.type = type;

    // Initialize stats based on level and type
    const stats = this.initializeStats();
    this.maxHP = stats.maxHP;
    this.ATK = stats.ATK;
    this.DEF = stats.DEF;
    this.SPD = stats.SPD;
    this.CRIT = stats.CRIT;

    // Initialize Accuracy/Evasion (enemies have slightly lower ACC than heroes)
    // ACC: Base 90 + (SPD * 0.4) - enemies are less accurate
    // EVA: Base 0 + (SPD * 0.25) - enemies are slightly easier to hit
    this.ACC = 90 + Math.floor(this.SPD * 0.4);
    this.EVA = Math.floor(this.SPD * 0.25);

    // Elite and Boss enemies get accuracy/evasion bonuses
    if (this.type === 'boss') {
      this.ACC += 20;
      this.EVA += 15;
    } else if (this.type === 'elite') {
      this.ACC += 10;
      this.EVA += 8;
    }

    // Combat state
    this.currentHP = this.maxHP;
    this.isAlive = true;
    this.initiative = 0;
    this.statusEffects = [];

    // Initialize elemental resistances based on type
    this.resistances = this.initializeResistances();
    this.weaknesses = this.initializeWeaknesses();
// Initialize position based on enemy type    this.position = this.determinePosition();
  }

  private initializeStats(): {
    maxHP: number;
    ATK: number;
    DEF: number;
    SPD: number;
    CRIT: number;
  } {
    // Base stats scaling with level - REBALANCED for better progression
    // Level 1 enemies should be weak, higher levels scale more aggressively
    const baseHP = 50;      // Reduced from 80 (weaker early game)
    const baseATK = 12;     // Reduced from 20 (less threatening)
    const baseDEF = 8;      // Reduced from 15 (easier to damage)
    const baseSPD = 10;     // Reduced from 12
    const baseCRIT = 3;     // Reduced from 5

    // Type multipliers - REBALANCED
    // Elite and Boss are now more distinct threats
    const typeMultipliers: Record<EnemyType, EnemyTypeMultipliers> = {
      normal: { hp: 1.0, atk: 1.0, def: 1.0 },
      elite: { hp: 1.8, atk: 1.4, def: 1.3 },    // Increased from 1.5/1.3/1.2
      boss: { hp: 3.5, atk: 1.7, def: 1.5 }      // Increased from 3.0/1.5/1.3
    };

    const multiplier = typeMultipliers[this.type];

    // Calculate stats with level scaling - MORE AGGRESSIVE scaling for higher levels
    // This creates better progression where low level is easy, high level is challenging
    const levelScaling = 1 + (this.level - 1) * 0.15; // 15% increase per level

    return {
      maxHP: Math.floor((baseHP + 12 * (this.level - 1)) * multiplier.hp * levelScaling),
      ATK: Math.floor((baseATK + 3 * (this.level - 1)) * multiplier.atk * levelScaling),
      DEF: Math.floor((baseDEF + 2 * (this.level - 1)) * multiplier.def * levelScaling),
      SPD: Math.floor(baseSPD + 1.5 * (this.level - 1)),
      CRIT: baseCRIT + 0.8 * (this.level - 1)
    };
  }

  /**
   * Initialize elemental resistances based on enemy type
   * Bosses and elites have better resistances
   */
  private initializeResistances(): ElementResistances {
    const baseResistances: ElementResistances = {
      physical: 0,
      fire: 0,
      ice: 0,
      lightning: 0,
      holy: 0,
      dark: 0
    };

    // Type-based resistance bonuses
    if (this.type === 'boss') {
      // Bosses have 15% resistance to all elements
      baseResistances.physical = 15;
      baseResistances.fire = 15;
      baseResistances.ice = 15;
      baseResistances.lightning = 15;
      baseResistances.holy = 15;
      baseResistances.dark = 15;
    } else if (this.type === 'elite') {
      // Elites have 10% resistance to all elements
      baseResistances.physical = 10;
      baseResistances.fire = 10;
      baseResistances.ice = 10;
      baseResistances.lightning = 10;
      baseResistances.holy = 10;
      baseResistances.dark = 10;
    }

    // Random elemental affinity for variety
    // 20% chance for enemy to have affinity (high resistance) to one element
    if (Math.random() < 0.2) {
      const elements: Element[] = ['fire', 'ice', 'lightning', 'holy', 'dark'];
      const affinityElement = elements[Math.floor(Math.random() * elements.length)];
      baseResistances[affinityElement] += 30;  // +30% to one random element
    }

    return baseResistances;
  }

  /**
   * Initialize elemental weaknesses
   * Normal enemies might have weaknesses, elites/bosses rarely do
   */
  private initializeWeaknesses(): Element[] {
    // Elites and bosses rarely have weaknesses
    if (this.type === 'elite' && Math.random() < 0.3) {
      // 30% chance for elite to have one weakness
      const elements: Element[] = ['fire', 'ice', 'lightning', 'holy', 'dark'];
      return [elements[Math.floor(Math.random() * elements.length)]];
    }

    if (this.type === 'boss') {
      // Bosses don't have weaknesses
      return [];
    }

    // Normal enemies: 50% chance to have a weakness
    if (Math.random() < 0.5) {
      const elements: Element[] = ['fire', 'ice', 'lightning', 'holy', 'dark'];
      return [elements[Math.floor(Math.random() * elements.length)]];
    }

    return [];
  }

  rollInitiative(): number {
    this.initiative = this.SPD + Math.floor(Math.random() * 11);
    return this.initiative;
  }

  takeDamage(rawDamage: number, isCrit: boolean = false, element: Element = 'physical'): number {
    if (!this.isAlive) return 0;

    // Check immunity first
    if (this.hasImmunity()) {
      console.log(`🛡️ ${this.name} is immune to damage!`);
      return 0;
    }

    const damageReduction = 100 / (100 + this.DEF);
    let finalDamage = Math.floor(rawDamage * damageReduction);

    if (isCrit) {
      finalDamage = Math.floor(rawDamage * 1.5 * (100 / (100 + this.DEF * 0.5)));
    }

    // Apply elemental resistance/weakness
    let elementalModifier = 1.0;
    if (element in this.resistances) {
      const resistance = this.resistances[element];
      elementalModifier = 1 - (resistance / 100);

      // Check for weakness
      if (this.weaknesses.includes(element)) {
        elementalModifier *= 1.5;
        console.log(`💥 ${this.name} is WEAK to ${element}!`);
      } else if (resistance > 0) {
        console.log(`🛡️ ${this.name} resists ${element} damage (${resistance}%)`);
      } else if (resistance < 0) {
        console.log(`💢 ${this.name} is vulnerable to ${element}!`);
      }
    }
    finalDamage = Math.floor(finalDamage * elementalModifier);

    // Apply damage reduction from status effects
    const statusReduction = this.getDamageReduction();
    if (statusReduction > 0) {
      finalDamage = Math.floor(finalDamage * (1 - statusReduction / 100));
      console.log(`🛡️ ${this.name}'s damage reduced by ${statusReduction}%`);
    }

    // Ensure minimum 1 damage (unless immune)
    finalDamage = Math.max(1, finalDamage);

    this.currentHP -= finalDamage;

    if (this.currentHP <= 0) {
      this.currentHP = 0;
      this.isAlive = false;
    }

    return finalDamage;
  }

  heal(amount: number): number {
    if (!this.isAlive) return 0;

    const oldHP = this.currentHP;
    this.currentHP = Math.min(this.currentHP + amount, this.maxHP);
    return this.currentHP - oldHP;
  }

  /**
   * Simple AI - choose target and attack
   */
  chooseAction(heroes: Combatant[]): CombatActionResult | null {
    // Simple AI: attack random alive hero
    const aliveHeroes = heroes.filter(h => h.isAlive);
    if (aliveHeroes.length === 0) return null;

    // Prioritize low HP targets (20% chance) or random
    let target: Combatant;
    if (Math.random() < 0.2) {
      // Attack lowest HP target
      target = aliveHeroes.reduce((lowest, hero) =>
        hero.currentHP < lowest.currentHP ? hero : lowest
      );
    } else {
      // Random target
      target = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
    }

    return this.attack(target);
  }

  attack(target: Combatant): CombatActionResult | null {
    if (!this.isAlive || !target.isAlive) return null;

    // Use combat stats with status effects applied
    const combatStats = this.getCombatStats();
    const targetStats = target.getCombatStats();

    // Roll for hit/miss using accuracy and evasion
    const hitRoll = Math.random() * 100;
    const hitChance = 100 + (combatStats.ACC - targetStats.EVA) / 10;
    const cappedHitChance = Math.max(5, Math.min(95, hitChance));
    const didHit = hitRoll < cappedHitChance;

    // If miss, return early with didMiss flag
    if (!didHit) {
      return {
        attacker: this,
        target: target,
        damage: 0,
        isCrit: false,
        didMiss: true,
        type: 'basic_attack'
      };
    }

    // Hit succeeded - proceed with normal damage calculation
    const isCrit = Math.random() * 100 < combatStats.CRIT;
    const damage = combatStats.ATK;
    const element: Element = 'physical'; // Basic attacks are physical damage
    const finalDamage = target.takeDamage(damage, isCrit, element);

    return {
      attacker: this,
      target: target,
      damage: finalDamage,
      isCrit: isCrit,
      didMiss: false,
      element: element,
      type: 'basic_attack'
    };
  }

  getInfo(): EnemyInfo {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      type: this.type,
      hp: this.currentHP,
      maxHP: this.maxHP,
      ATK: this.ATK,
      DEF: this.DEF,
      SPD: this.SPD,
      CRIT: this.CRIT,
      isAlive: this.isAlive,
      hpPercent: (this.currentHP / this.maxHP) * 100
    };
  }

  // ============================================================================
  // STATUS EFFECTS SYSTEM (same as Hero)
  // ============================================================================

  addStatusEffect(effect: StatusEffect): void {
    const existing = this.statusEffects.find(e => e.name === effect.name);
    if (existing) {
      existing.duration = effect.duration;
    } else {
      this.statusEffects.push(effect);
    }
    console.log(`⭐ ${this.name} gained ${effect.name} (${effect.duration} turns)`);
  }

  tickStatusEffects(): void {
    this.statusEffects = this.statusEffects
      .map(effect => ({ ...effect, duration: effect.duration - 1 }))
      .filter(effect => {
        if (effect.duration <= 0) {
          console.log(`💨 ${effect.name} expired on ${this.name}`);
          return false;
        }
        return true;
      });
  }

  isStunned(): boolean {
    return this.statusEffects.some(e => e.stun === true);
  }

  hasImmunity(): boolean {
    return this.statusEffects.some(e => e.immunity === true);
  }

  getEffectiveStat(baseStat: number, statName: 'ATK' | 'DEF' | 'SPD' | 'CRIT' | 'ACC' | 'EVA'): number {
    let modifier = 0;
    for (const effect of this.statusEffects) {
      if (effect.stat === statName && effect.value) {
        modifier += effect.value;
      }
    }
    return Math.floor(baseStat * (1 + modifier / 100));
  }

  getDamageReduction(): number {
    let reduction = 0;
    for (const effect of this.statusEffects) {
      if (effect.stat === 'damageReduction' && effect.value) {
        reduction += effect.value;
      }
    }
    return Math.min(reduction, 90);
  }

  /**
   * Determine position based on enemy type
   */
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

  /**
   * Get position bonuses
   */
  getPositionBonuses(): PositionBonuses {
    return POSITION_BONUSES[this.position];
  }

  getCombatStats() {
    return {
      ATK: this.getEffectiveStat(this.ATK, 'ATK'),
      DEF: this.getEffectiveStat(this.DEF, 'DEF'),
      SPD: this.getEffectiveStat(this.SPD, 'SPD'),
      CRIT: this.getEffectiveStat(this.CRIT, 'CRIT'),
      ACC: this.getEffectiveStat(this.ACC, 'ACC'),
      EVA: this.getEffectiveStat(this.EVA, 'EVA')
    };
  }

  /**
   * Reset combat state (status effects) without healing
   * Use this between combats to prepare for next fight while keeping current HP
   */
  resetCombatState(): void {
    this.statusEffects = [];
  }

  /**
   * Full reset including HP restoration
   * Use this only when enemy should be fully healed (e.g., new spawn, revival)
   */
  reset(): void {
    this.currentHP = this.maxHP;
    this.isAlive = true;
    this.resetCombatState();
  }

  // Required for Combatant interface compatibility
  tickCooldowns(): void {
    // Enemies don't have cooldowns in current implementation
  }
}

// ============================================================================
// ENEMY GENERATOR
// ============================================================================

const ENEMY_NAMES = [
  'Goblin',
  'Orc',
  'Skeleton',
  'Spider',
  'Wolf',
  'Bandit',
  'Dark Knight',
  'Zombie',
  'Imp',
  'Slime'
];

/**
 * Generate a random enemy
 */
export function generateRandomEnemy(level: number, type: EnemyType = 'normal'): Enemy {
  const name = ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)];
  return new Enemy(name, level, type);
}

/**
 * Generate multiple enemies
 */
export function generateEnemyGroup(
  count: number,
  level: number,
  types?: EnemyType[]
): Enemy[] {
  const enemies: Enemy[] = [];

  for (let i = 0; i < count; i++) {
    const type = types ? types[i % types.length] : 'normal';
    enemies.push(generateRandomEnemy(level, type));
  }

  return enemies;
}
