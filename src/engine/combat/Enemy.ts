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
 * @lastModified 2025-11-07
 */

import type {
  EnemyType,
  EnemyInfo,
  EnemyTypeMultipliers,
  CombatActionResult,
  Combatant
} from '../../types/combat.types';
import type { StatusEffect } from '../../types/hero.types';

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

  // Combat state
  currentHP: number;
  isAlive: boolean;
  initiative: number;
  statusEffects: StatusEffect[];

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

    // Combat state
    this.currentHP = this.maxHP;
    this.isAlive = true;
    this.initiative = 0;
    this.statusEffects = [];
  }

  private initializeStats(): {
    maxHP: number;
    ATK: number;
    DEF: number;
    SPD: number;
    CRIT: number;
  } {
    // Base stats scaling with level
    const baseHP = 80;
    const baseATK = 20;
    const baseDEF = 15;
    const baseSPD = 12;
    const baseCRIT = 5;

    // Type multipliers
    const typeMultipliers: Record<EnemyType, EnemyTypeMultipliers> = {
      normal: { hp: 1.0, atk: 1.0, def: 1.0 },
      elite: { hp: 1.5, atk: 1.3, def: 1.2 },
      boss: { hp: 3.0, atk: 1.5, def: 1.3 }
    };

    const multiplier = typeMultipliers[this.type];

    // Calculate stats with level scaling
    return {
      maxHP: Math.floor((baseHP + 8 * (this.level - 1)) * multiplier.hp),
      ATK: Math.floor((baseATK + 2 * (this.level - 1)) * multiplier.atk),
      DEF: Math.floor((baseDEF + 1.5 * (this.level - 1)) * multiplier.def),
      SPD: Math.floor(baseSPD + 1 * (this.level - 1)),
      CRIT: baseCRIT + 0.5 * (this.level - 1)
    };
  }

  rollInitiative(): number {
    this.initiative = this.SPD + Math.floor(Math.random() * 11);
    return this.initiative;
  }

  takeDamage(rawDamage: number, isCrit: boolean = false): number {
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

    // Apply damage reduction from status effects
    const statusReduction = this.getDamageReduction();
    if (statusReduction > 0) {
      finalDamage = Math.floor(finalDamage * (1 - statusReduction / 100));
      console.log(`🛡️ ${this.name}'s damage reduced by ${statusReduction}%`);
    }

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
  chooseAction(heroes: Combatant[], _enemies: Combatant[]): CombatActionResult | null {
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
    const isCrit = Math.random() * 100 < combatStats.CRIT;
    const damage = combatStats.ATK;
    const finalDamage = target.takeDamage(damage, isCrit);

    return {
      attacker: this,
      target: target,
      damage: finalDamage,
      isCrit: isCrit,
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

  getEffectiveStat(baseStat: number, statName: 'ATK' | 'DEF' | 'SPD' | 'CRIT'): number {
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

  getCombatStats() {
    return {
      ATK: this.getEffectiveStat(this.ATK, 'ATK'),
      DEF: this.getEffectiveStat(this.DEF, 'DEF'),
      SPD: this.getEffectiveStat(this.SPD, 'SPD'),
      CRIT: this.getEffectiveStat(this.CRIT, 'CRIT')
    };
  }

  reset(): void {
    this.currentHP = this.maxHP;
    this.isAlive = true;
    this.statusEffects = [];
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
