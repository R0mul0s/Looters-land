/**
 * Hero System - Playable character management
 *
 * Defines hero characters with classes, stats, skills, and equipment.
 * Heroes have 5 different classes with unique stat distributions and skills.
 *
 * Contains:
 * - Hero class - Playable character with stats and combat abilities
 * - 5 Hero classes (Warrior, Archer, Mage, Cleric, Paladin)
 * - Experience and leveling system with XP progression
 * - Level-based stat scaling with class-specific growth rates (+5% HP, +3% ATK/DEF, +2% SPD, +0.5% CRIT per level)
 * - Skill system with cooldown management
 * - Equipment integration with stat bonuses
 * - Combat state tracking (HP, status effects, cooldowns)
 * - Status effects system (buffs/debuffs with duration tracking)
 * - Stat modifiers from active effects
 * - Immunity and damage reduction mechanics
 * - Reset functionality for combat preparation
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-07
 */

import type { HeroClass, HeroStats, BaseStats, HeroInfo, AttackResult, StatusEffect, HeroRarity } from '../../types/hero.types';
import type { Equipment } from '../equipment/Equipment';
import { getSkillsForClass, type Skill } from '../combat/Skill';
import type { CombatActionResult, Combatant } from '../../types/combat.types';

export class Hero {
  id: string;
  name: string;
  class: HeroClass;
  rarity: HeroRarity;
  level: number;

  // Static counter to ensure truly unique IDs
  private static _idCounter: number = 0;

  // Hero metadata (from template)
  role?: 'tank' | 'dps' | 'healer' | 'support';
  description?: string;
  specialAbility?: string;
  faction?: string;

  // Current stats (including equipment bonuses)
  maxHP: number;
  ATK: number;
  DEF: number;
  SPD: number;
  CRIT: number;

  // Base stats (without equipment)
  baseMaxHP: number;
  baseATK: number;
  baseDEF: number;
  baseSPD: number;
  baseCRIT: number;

  // Combat state
  currentHP: number;
  isAlive: boolean;
  initiative: number;

  // Combat tracking
  cooldowns: Map<string, number>;
  ultimateCharge: number;
  statusEffects: StatusEffect[];

  // Progression
  experience: number;
  requiredXP: number;
  talentPoints: number;

  // Convenience getters for UI
  get xp(): number {
    return this.experience;
  }

  get xpToNextLevel(): number {
    return this.requiredXP;
  }

  // Equipment reference
  equipment?: Equipment;

  constructor(name: string, heroClass: HeroClass, level: number = 1, rarity: HeroRarity = 'common') {
    // Generate truly unique ID using timestamp, random, and counter
    Hero._idCounter++;
    this.id = `hero_${Date.now()}_${Math.random()}_${Hero._idCounter}`;
    this.name = name;
    this.class = heroClass;
    this.rarity = rarity;
    this.level = level;

    // Initialize progression
    this.experience = 0;
    this.requiredXP = this.calculateRequiredXP(level);
    this.talentPoints = 0;

    // Initialize base stats based on class
    const stats = this.initializeStats();
    this.maxHP = stats.maxHP;
    this.ATK = stats.ATK;
    this.DEF = stats.DEF;
    this.SPD = stats.SPD;
    this.CRIT = stats.CRIT;

    // Store base stats
    this.baseMaxHP = this.maxHP;
    this.baseATK = this.ATK;
    this.baseDEF = this.DEF;
    this.baseSPD = this.SPD;
    this.baseCRIT = this.CRIT;

    // Combat state
    this.currentHP = this.maxHP;
    this.isAlive = true;
    this.initiative = 0;

    // Combat tracking
    this.cooldowns = new Map();
    this.ultimateCharge = 0;
    this.statusEffects = [];
  }

  private initializeStats(): HeroStats {
    const classStats: Record<HeroClass, BaseStats> = {
      warrior: {
        maxHP: 150,
        ATK: 25,
        DEF: 30,
        SPD: 10,
        CRIT: 5,
        hpGrowth: 10,
        atkGrowth: 2,
        defGrowth: 2.5,
        spdGrowth: 0.5,
        critGrowth: 0.3
      },
      archer: {
        maxHP: 80,
        ATK: 35,
        DEF: 10,
        SPD: 25,
        CRIT: 15,
        hpGrowth: 5,
        atkGrowth: 3,
        defGrowth: 0.8,
        spdGrowth: 1.5,
        critGrowth: 0.8
      },
      mage: {
        maxHP: 70,
        ATK: 40,
        DEF: 8,
        SPD: 15,
        CRIT: 10,
        hpGrowth: 4,
        atkGrowth: 3.5,
        defGrowth: 0.5,
        spdGrowth: 1,
        critGrowth: 0.5
      },
      cleric: {
        maxHP: 100,
        ATK: 15,
        DEF: 20,
        SPD: 12,
        CRIT: 5,
        hpGrowth: 7,
        atkGrowth: 1.2,
        defGrowth: 1.5,
        spdGrowth: 0.8,
        critGrowth: 0.3
      },
      paladin: {
        maxHP: 120,
        ATK: 22,
        DEF: 25,
        SPD: 14,
        CRIT: 8,
        hpGrowth: 8,
        atkGrowth: 2,
        defGrowth: 2,
        spdGrowth: 1,
        critGrowth: 0.5
      }
    };

    const stats = classStats[this.class];

    return {
      maxHP: Math.floor(stats.maxHP + (stats.hpGrowth * (this.level - 1))),
      ATK: Math.floor(stats.ATK + (stats.atkGrowth * (this.level - 1))),
      DEF: Math.floor(stats.DEF + (stats.defGrowth * (this.level - 1))),
      SPD: Math.floor(stats.SPD + (stats.spdGrowth * (this.level - 1))),
      CRIT: stats.CRIT + (stats.critGrowth * (this.level - 1))
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

    // Apply damage reduction from status effects (e.g., Mana Shield)
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

  attack(target: Hero): AttackResult | null {
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

  tickCooldowns(): void {
    for (const [skillName, cd] of this.cooldowns.entries()) {
      if (cd > 0) {
        this.cooldowns.set(skillName, cd - 1);
      }
    }
  }

  getSkills(): Skill[] {
    return getSkillsForClass(this.class);
  }

  useSkill(skillIndex: number, targets: Combatant[]): CombatActionResult | null {
    const skills = this.getSkills();
    if (skillIndex < 0 || skillIndex >= skills.length) return null;

    const skill = skills[skillIndex];
    const currentCD = this.cooldowns.get(skill.name) || 0;

    if (currentCD > 0) {
      return null; // Skill on cooldown
    }

    // Execute skill
    const result = skill.execute(this, targets);

    // Set cooldown
    this.cooldowns.set(skill.name, skill.cooldown);

    return result;
  }

  getInfo(): HeroInfo {
    return {
      id: this.id,
      name: this.name,
      class: this.class,
      level: this.level,
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

  updateStatsWithEquipment(): void {
    if (!this.equipment) return;

    const equipStats = this.equipment.getTotalEquipmentStats();

    this.maxHP = Math.floor(this.baseMaxHP + (equipStats.HP || 0));
    this.ATK = Math.floor(this.baseATK + (equipStats.ATK || 0));
    this.DEF = Math.floor(this.baseDEF + (equipStats.DEF || 0));
    this.SPD = Math.floor(this.baseSPD + (equipStats.SPD || 0));
    this.CRIT = Math.floor(this.baseCRIT + (equipStats.CRIT || 0));

    if (this.currentHP > this.maxHP) {
      this.currentHP = this.maxHP;
    }

    console.log(`📊 ${this.name} stats updated with equipment:`, {
      HP: `${this.baseMaxHP} + ${equipStats.HP || 0} = ${this.maxHP}`,
      ATK: `${this.baseATK} + ${equipStats.ATK || 0} = ${this.ATK}`,
      DEF: `${this.baseDEF} + ${equipStats.DEF || 0} = ${this.DEF}`,
      SPD: `${this.baseSPD} + ${equipStats.SPD || 0} = ${this.SPD}`,
      CRIT: `${this.baseCRIT} + ${equipStats.CRIT || 0} = ${this.CRIT}`
    });
  }

  // ============================================================================
  // STATUS EFFECTS SYSTEM
  // ============================================================================

  /**
   * Add a status effect to this hero
   */
  addStatusEffect(effect: StatusEffect): void {
    // Check if effect already exists
    const existing = this.statusEffects.find(e => e.name === effect.name);
    if (existing) {
      // Refresh duration
      existing.duration = effect.duration;
    } else {
      this.statusEffects.push(effect);
    }
    console.log(`⭐ ${this.name} gained ${effect.name} (${effect.duration} turns)`);
  }

  /**
   * Tick all status effects (reduce duration by 1)
   * Called at the end of each turn
   */
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

  /**
   * Check if character is stunned (skips turn)
   */
  isStunned(): boolean {
    return this.statusEffects.some(e => e.stun === true);
  }

  /**
   * Check if character has immunity (no damage taken)
   */
  hasImmunity(): boolean {
    return this.statusEffects.some(e => e.immunity === true);
  }

  /**
   * Get effective stat value including status effect modifiers
   */
  getEffectiveStat(baseStat: number, statName: 'ATK' | 'DEF' | 'SPD' | 'CRIT'): number {
    let modifier = 0;

    for (const effect of this.statusEffects) {
      if (effect.stat === statName && effect.value) {
        modifier += effect.value;
      }
    }

    // Apply percentage modifier
    return Math.floor(baseStat * (1 + modifier / 100));
  }

  /**
   * Get damage reduction from status effects (e.g., Mana Shield)
   */
  getDamageReduction(): number {
    let reduction = 0;

    for (const effect of this.statusEffects) {
      if (effect.stat === 'damageReduction' && effect.value) {
        reduction += effect.value;
      }
    }

    return Math.min(reduction, 90); // Cap at 90% reduction
  }

  /**
   * Get combat stats with status effects applied
   */
  getCombatStats() {
    return {
      ATK: this.getEffectiveStat(this.ATK, 'ATK'),
      DEF: this.getEffectiveStat(this.DEF, 'DEF'),
      SPD: this.getEffectiveStat(this.SPD, 'SPD'),
      CRIT: this.getEffectiveStat(this.CRIT, 'CRIT')
    };
  }

  /**
   * Calculate required XP for a given level
   * Formula: 100 * (level ^ 1.5)
   *
   * @param level - Target level
   * @returns Required XP to reach next level
   *
   * @example
   * ```typescript
   * const xp = hero.calculateRequiredXP(5); // 559 XP needed for level 6
   * ```
   */
  calculateRequiredXP(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * Award experience points and handle level ups
   *
   * @param amount - Amount of XP to award
   * @returns Array of level up messages (empty if no level up)
   *
   * @example
   * ```typescript
   * const messages = hero.gainXP(150);
   * // ["Theron leveled up! (Lv.1 → Lv.2)", "HP: 150 → 157 (+7)"]
   * ```
   */
  gainXP(amount: number): string[] {
    this.experience += amount;
    console.log(`⭐ ${this.name} gained ${amount} XP (${this.experience}/${this.requiredXP})`);

    const levelUpMessages: string[] = [];

    // Check for level ups (can level up multiple times from one XP gain)
    while (this.experience >= this.requiredXP) {
      this.experience -= this.requiredXP;
      this.level++;

      // Store old stats for comparison
      const oldMaxHP = this.maxHP;
      const oldATK = this.ATK;
      const oldDEF = this.DEF;
      const oldSPD = this.SPD;
      const oldCRIT = this.CRIT;

      // Apply stat growth
      this.applyLevelUpGrowth();

      // Calculate new required XP
      this.requiredXP = this.calculateRequiredXP(this.level);

      // Heal to full on level up
      this.currentHP = this.maxHP;

      // Generate level up messages
      levelUpMessages.push(`🎉 ${this.name} leveled up! (Lv.${this.level - 1} → Lv.${this.level})`);
      levelUpMessages.push(`  HP: ${oldMaxHP} → ${this.maxHP} (+${this.maxHP - oldMaxHP})`);
      levelUpMessages.push(`  ATK: ${oldATK} → ${this.ATK} (+${this.ATK - oldATK})`);
      levelUpMessages.push(`  DEF: ${oldDEF} → ${this.DEF} (+${this.DEF - oldDEF})`);
      levelUpMessages.push(`  SPD: ${oldSPD} → ${this.SPD} (+${this.SPD - oldSPD})`);
      levelUpMessages.push(`  CRIT: ${oldCRIT.toFixed(1)}% → ${this.CRIT.toFixed(1)}% (+${(this.CRIT - oldCRIT).toFixed(1)}%)`);

      console.log(`🎉 ${this.name} reached level ${this.level}!`);
    }

    return levelUpMessages;
  }

  /**
   * Apply stat growth on level up
   * Growth rates:
   * - HP: +5% base MaxHP
   * - ATK: +3% base ATK
   * - DEF: +3% base DEF
   * - SPD: +2% base SPD
   * - CRIT: +0.5% per level
   */
  private applyLevelUpGrowth(): void {
    // Get class-specific growth rates
    const growthRates: Record<HeroClass, BaseStats> = {
      warrior: {
        maxHP: 150,
        ATK: 25,
        DEF: 30,
        SPD: 10,
        CRIT: 5,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      },
      archer: {
        maxHP: 120,
        ATK: 30,
        DEF: 15,
        SPD: 25,
        CRIT: 15,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      },
      mage: {
        maxHP: 100,
        ATK: 35,
        DEF: 10,
        SPD: 15,
        CRIT: 10,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      },
      cleric: {
        maxHP: 110,
        ATK: 20,
        DEF: 20,
        SPD: 18,
        CRIT: 8,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      },
      paladin: {
        maxHP: 140,
        ATK: 22,
        DEF: 35,
        SPD: 12,
        CRIT: 7,
        hpGrowth: 0.05,
        atkGrowth: 0.03,
        defGrowth: 0.03,
        spdGrowth: 0.02,
        critGrowth: 0.5
      }
    };

    const growth = growthRates[this.class];

    // Apply growth to base stats (using Math.ceil to ensure minimum +1 growth)
    this.baseMaxHP = Math.ceil(this.baseMaxHP * (1 + growth.hpGrowth));
    this.baseATK = Math.ceil(this.baseATK * (1 + growth.atkGrowth));
    this.baseDEF = Math.ceil(this.baseDEF * (1 + growth.defGrowth));
    this.baseSPD = Math.ceil(this.baseSPD * (1 + growth.spdGrowth));
    this.baseCRIT = parseFloat((this.baseCRIT + growth.critGrowth).toFixed(1));

    // Recalculate current stats with equipment bonuses
    if (this.equipment) {
      this.equipment.recalculateStats();
    } else {
      // If no equipment, just copy base stats
      this.maxHP = this.baseMaxHP;
      this.ATK = this.baseATK;
      this.DEF = this.baseDEF;
      this.SPD = this.baseSPD;
      this.CRIT = this.baseCRIT;
    }
  }

  reset(): void {
    this.currentHP = this.maxHP;
    this.isAlive = true;
    this.cooldowns.clear();
    this.ultimateCharge = 0;
    this.statusEffects = [];
  }
}
